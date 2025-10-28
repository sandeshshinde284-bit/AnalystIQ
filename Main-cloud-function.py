# -*- coding: utf-8 -*-
"""
================================================================================
Investment Analysis Cloud Function (main.py)
================================================================================

Purpose:
--------
This script is a Google Cloud Function that acts as a secure and scalable API 
endpoint for analyzing investment documents. It is designed to process startup 
pitch decks, financial models, and other business documents to provide a 
comprehensive investment analysis, similar to what a venture capital analyst would produce.

Workflow:
---------
1.  **Receive Request:** The function listens for HTTPS POST requests containing
    one or more files (`multipart/form-data`). It also handles CORS preflight
    requests (`OPTIONS`).

2.  **Validate Files:** Each uploaded file is rigorously validated against a set
    of criteria:
    -   File presence, size (max 50MB), and type (PDF, DOCX, etc.).
    -   Content validity (e.g., is it a business document?).

3.  **Extract Text (Document AI):** The core text extraction is handled by Google
    Cloud Document AI. The script has intelligent logic to handle documents of
    any size:
    -   **Online Processing (Fast):** For smaller documents, it uses the fast,
        synchronous API.
        - With OCR (`USE_OCR=True`): Up to 15 pages.
        - Imageless (`USE_OCR=False`): Up to 30 pages.
    -   **Batch Processing (Robust):** If a document exceeds the online page limit,
        the script automatically uploads it to Google Cloud Storage (GCS) and
        initiates an asynchronous batch job, which can handle up to 500 pages.

4.  **Analyze Content (Vertex AI Gemini):** The extracted text is sent to a 
    powerful large language model (Gemini) via Vertex AI. The model is given a 
    detailed prompt instructing it to act as a senior VC analyst and return its
    findings in a structured JSON format.

5.  **Validate AI Response:** The JSON response from Gemini is validated to ensure
    it contains all the required fields (e.g., `startupName`, `recommendation`, 
    `riskAssessment`) before being sent to the client.

6.  **Return Structured Response:** The function returns a comprehensive JSON 
    object containing the full analysis, metadata about the processed files, 
    and detailed error messages if any step fails.

Key Technologies Used:
----------------------
-   **Google Cloud Functions:** For serverless, scalable execution.
-   **Google Cloud Document AI:** For high-accuracy text extraction with OCR.
-   **Google Cloud Vertex AI:** To access and run the Gemini generative model.
-   **Google Cloud Storage:** As a temporary holding area for large files during
    batch processing.
-   **Flask:** As the underlying web framework for handling HTTP requests.

How to Modify:
--------------
-   **Project & Processor IDs:** Change `PROJECT_ID`, `LOCATION`, `PROCESSOR_ID`,
    and bucket names under the `--- CONFIGURATION ---` section to match your
    Google Cloud setup.
-   **OCR Setting:** The `USE_OCR` variable is crucial. Set it to `"true"` (default)
    to analyze scanned documents or PDFs with text in images. Set it to `"false"`
    for faster processing of purely digital documents.
-   **Analysis Prompt:** The prompt within the `analyze_investment_opportunity`
    function can be modified to change the structure or focus of the AI's analysis.

================================================================================
INVESTMENT ANALYSIS CLOUD FUNCTION (main.py)
================================================================================

OVERVIEW:
---------
Google Cloud Function that analyzes startup pitch decks and business documents
using OCR (Document AI) and AI (Gemini) to provide venture capital investment
insights. Handles files up to 500 pages via intelligent online/batch processing.

PROCESSING FLOW:
----------------
1. Receive file(s) via multipart/form-data POST request
2. Validate files (type, size, extension)
3. Extract text using Document AI with OCR
   - Online: Up to 15 pages (fast)
   - Batch: Up to 500 pages (via GCS)
4. Validate extracted text (minimum length, business keywords)
5. Analyze with Gemini for VC-style investment analysis
6. Validate AI response structure
7. Return comprehensive JSON analysis

KEY FEATURES:
-------------
✓ Handles multiple file uploads
✓ OCR support for image-based PDFs
✓ Automatic online-to-batch fallback
✓ GCS cleanup after processing
✓ Comprehensive error handling
✓ CORS support for frontend integration


================================================================================
"""

# Import standard and Google Cloud libraries
import os    # For environment variables
import json  # For JSON encoding/decoding
import base64  # For encoding/decoding file data
import re  # For regex parsing
from flask import Request  # For HTTP request handling
from google.cloud import documentai, storage  # Document AI and GCS clients
import vertexai  # Vertex AI initialization
from vertexai.generative_models import GenerativeModel  # Gemini model
import functions_framework  # For GCP Cloud Functions
from datetime import datetime, timedelta  # For timestamps
from functools import wraps
from google.cloud import firestore
import uuid

db = firestore.Client()

# --- CONFIGURATION ---
# Read project and processor info from environment or use default
PROJECT_ID = os.getenv("GCP_PROJECT_ID", "analyst-iq")
LOCATION = os.getenv("GCP_LOCATION", "us-central1")
PROCESSOR_ID = os.getenv("PROCESSOR_ID", "bd0934fc7b8dcd10")
PROCESSOR_LOCATION = os.getenv("PROCESSOR_LOCATION", "us")

INPUT_BUCKET_NAME = os.getenv("INPUT_BUCKET", "analyst-iq-docai-input")
OUTPUT_BUCKET_NAME = os.getenv("OUTPUT_BUCKET", "analyst-iq-docai-output")

# File validation constants
ALLOWED_EXTENSIONS = ['pdf', 'txt', 'docx', 'pptx', 'doc', 'ppt']
ALLOWED_MIME_TYPES = [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-powerpoint',
    'application/vnd.ms-office',
]
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
MIN_EXTRACTED_TEXT = 50  # Minimum characters for valid extraction (batch jobs may have small initial extracts)

# Document AI Processing limits
MAX_ONLINE_PAGES = 15  # OCR: 15 pages max for online/synchronous
MAX_IMAGELESS_PAGES = 30  # Imageless mode: 30 pages max
MAX_BATCH_PAGES = 500  # Batch: 500 pages max
USE_OCR = os.getenv("USE_OCR", "true").lower() == "true"  # Enable OCR by default
request_tracker = {} # ✅ SECURITY: Rate limiting

# =============================================================================
# INITIALIZATION
# =============================================================================

# Initialize Google Cloud clients
try:
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    docai_client = documentai.DocumentProcessorServiceClient(
        client_options={"api_endpoint": f"{PROCESSOR_LOCATION}-documentai.googleapis.com"}
    ) # Document AI
    storage_client = storage.Client()
    print(f"✅ GCP clients initialized for project: {PROJECT_ID}")
except Exception as e:
    print(f"⚠️ Warning: GCP client initialization issue: {e}")

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

# Helper: Return CORS headers for HTTP responses
def get_cors_headers(include_content_type=True):
    """Return CORS headers for responses"""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '3600',
    }
    if include_content_type:
        headers['Content-Type'] = 'application/json'
    return headers

# ✅ NEW: Text sanitization
def sanitize_extracted_text(text: str) -> str:
    """Remove potentially dangerous characters from extracted text"""
    if not text:
        return ""
    
    # Remove null bytes (very dangerous)
    text = text.replace('\x00', '')
    
    # Remove other control characters except newline, carriage return, tab
    # Control characters are ASCII 0-31, but we keep \n (10), \r (13), \t (9)
    text = ''.join(
        char for char in text 
        if ord(char) >= 32 or char in '\n\r\t'
    )
    
    # Remove excessive whitespace
    # This prevents weird spacing/newline injection
    text = ' '.join(text.split())
    
    return text    

# ✅ NEW: Magic byte verification
def verify_file_magic_bytes(file_bytes: bytes, filename: str) -> tuple:
    """Verify file type using magic bytes (file signatures)"""
    magic_bytes_map = {
        'pdf': [b'%PDF'],
        'docx': [b'PK\x03\x04'],
        'xlsx': [b'PK\x03\x04'],
        'pptx': [b'PK\x03\x04'],
        'doc': [b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'],
        'ppt': [b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'],
    }
    
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext not in magic_bytes_map:
        return False, "UNSUPPORTED_FORMAT", f"File type .{ext} not supported"
    
    file_start = file_bytes[:8]
    for signature in magic_bytes_map[ext]:
        if file_start.startswith(signature):
            return True, "VALID", "File signature verified"
    
    return False, "INVALID_FILE_SIGNATURE", f"File signature doesn't match .{ext} format"

# ✅ NEW: Escape Gemini prompt input
def escape_gemini_input(text: str) -> str:
    """Escape special characters for Gemini"""
    text = text.replace('```', '` ` `')
    text = text.replace('---', '- - -')
    text = text.replace('{{', '{ {')
    return text

# ✅ NEW: Rate limiting decorator
def rate_limit(max_requests=10, time_window=60):
    """Rate limit by IP address"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            client_ip = "unknown"
            try:
                if args and hasattr(args[0], 'remote_addr'):
                    client_ip = args[0].remote_addr
            except:
                pass
            
            now = datetime.now()
            if client_ip not in request_tracker:
                request_tracker[client_ip] = []
            
            request_tracker[client_ip] = [
                req_time for req_time in request_tracker[client_ip]
                if now - req_time < timedelta(seconds=time_window)
            ]
            
            if len(request_tracker[client_ip]) >= max_requests:
                cors_headers_local = get_cors_headers()
                return (
                    json.dumps({"status": "error", "code": "RATE_LIMITED", 
                               "message": "Too many requests. Please wait."}),
                    429,
                    cors_headers_local
                )
            
            request_tracker[client_ip].append(now)
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Helper: Validate uploaded file for type, size, and extension
def validate_file_upload(file):
    """Validate uploaded file"""
    # Check file exists
    if not file or not file.filename:
        return False, "FILE_NOT_PROVIDED", "No file selected"
    
    # Check file size
    if file.content_length and file.content_length > MAX_FILE_SIZE:
        size_mb = file.content_length / (1024 * 1024)
        return False, "FILE_TOO_LARGE", f"File is {size_mb:.1f}MB. Maximum 50MB allowed"
    
    if file.content_length == 0:
        return False, "EMPTY_FILE", "File is empty"
    
    # Check file extension
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if not ext or ext not in ALLOWED_EXTENSIONS:
        return False, "INVALID_FILE_TYPE", f"File type '.{ext}' not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
    
    # Check MIME type (if provided)
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        print(f"⚠️ MIME type {file.content_type} not in allowed list, but extension is valid")
    
    return True, "VALID", "File validation passed"

# ✅ CONTENT-BASED VALIDATION (Not filename-based) - FORTRESS LEVEL
def validate_extraction(extracted_data, request_id=None):
    """
    Comprehensive multi-layer validation:
    1. Personal document detection
    2. Non-business content detection
    3. Business content verification
    4. Content structure analysis
    5. Optional Gemini secondary check
    """
    full_text = extracted_data.get('full_text', '')
    page_count = extracted_data.get('page_count', 0)

    # ✅ SECURITY: Sanitize text - ADD THESE 2 LINES
    full_text = sanitize_extracted_text(full_text)
    extracted_data['full_text'] = full_text
    
    # Check if text was extracted
    if not full_text or len(full_text) < MIN_EXTRACTED_TEXT:
        return False, "NO_TEXT_EXTRACTED", "Unable to extract readable text from document. The file may be corrupted, image-only, encrypted, or not a valid business document."
    
    # Check page count
    if page_count == 0:
        return False, "NO_PAGES_DETECTED", "Document appears to be empty or unreadable."
    
    text_lower = full_text.lower()
    
    print(f"\n{'='*60}")
    print(f"🔒 FORTRESS VALIDATION - 5 LAYER SECURITY CHECK")
    print(f"{'='*60}")
    
    # ============================================================================
    # LAYER 1: PERSONAL DOCUMENT DETECTION
    # ============================================================================
    print(f"\n📋 LAYER 1: Personal Document Detection")
    
    personal_indicators = {
        'identity_docs': {
            'keywords': ['passport', 'aadhar', 'pan number', 'ssn', 'social security', 
                        'driving license', 'voter id', 'national id', 'id card', 'license number',
                        'national identification', 'voter card', 'id proof'],
            'weight': 3.0  # High confidence indicator
        },
        'personal_medical': {
            'keywords': ['prescription', 'medical report', 'diagnosis', 'discharge summary',
                        'patient', 'physician', 'hospital', 'clinic', 'medical certificate',
                        'health record', 'patient id', 'doctor'],
            'weight': 2.5
        },
        'personal_financial': {
            'keywords': ['credit card', 'debit card', 'bank account', 'account number',
                        'swift code', 'ifsc', 'epfo', 'pf account', 'uan number',
                        'provident fund', 'bank statement', 'cheque', 'account holder'],
            'weight': 2.8
        },
        'personal_legal': {
            'keywords': ['birth certificate', 'marriage certificate', 'divorce', 'will', 'testament',
                        'adoption', 'death certificate', 'legal document'],
            'weight': 2.5
        },
        'resume_cv': {
            'keywords': ['objective:', 'work experience', 'skills section', 'education:', 'references',
                        'cv', 'resume', 'curriculum vitae', 'employment history', 'professional summary'],
            'weight': 3.5  # HIGHEST - clearest personal doc
        },
        'personal_photos': {
            'keywords': ['photo', 'photograph', 'selfie', 'portrait', 'headshot', 'image', 'picture'],
            'weight': 1.5
        },
    }
    
    personal_score = 0
    detected_personal_types = []
    
    for category, config in personal_indicators.items():
        keywords = config['keywords']
        weight = config['weight']
        keyword_matches = sum(1 for kw in keywords if kw in text_lower)
        
        if keyword_matches >= 3:  # 2+ keywords in this category
            weighted_score = keyword_matches * weight
            personal_score += weighted_score
            detected_personal_types.append(f"{category}({keyword_matches})")
            print(f"   ⚠️  Detected: {category} - {keyword_matches} keywords, Score: {weighted_score:.1f}")
    
    print(f"   📊 Personal Score: {personal_score:.1f}")
    
    if personal_score > 8:  # Stricter threshold
        error_msg = f"Document appears to be personal ({', '.join(set(detected_personal_types))})"
        print(f"   ❌ REJECTED: {error_msg}")
        extracted_data['validation_error_code'] = 'PERSONAL_DOCUMENT'
        if request_id:
            write_error_to_firestore(request_id, 'PERSONAL_DOCUMENT', "This document contains personal information and cannot be analyzed. Please upload business documents only.")
        return False, "PERSONAL_DOCUMENT", "This document contains personal information and cannot be analyzed. Please upload business documents only."
    
    resume_score = 0
    if text_lower.count('objective:') > 0:
        resume_score += 2
    if text_lower.count('work experience') > 0:
        resume_score += 2
    if text_lower.count('skills') > 0:
        resume_score += 1
    if text_lower.count('education') > 0:
        resume_score += 1

    if resume_score >= 4:
        # Flag as resume but DON'T reject yet
        # Let validate_file_set handle it
        extracted_data['document_classification'] = {
            'type': 'RESUME',
            'confidence': 'high',
            'reason': 'Resume detected'
        }
        print(f"   ⚠️  Document appears to be a resume")


    # ============================================================================
    # LAYER 2: NON-BUSINESS CONTENT DETECTION
    # ============================================================================
    print(f"\n📋 LAYER 2: Non-Business Content Detection")
    
    non_business_indicators = {
        'recipe': {
            'keywords': ['recipe', 'ingredients', 'cooking', 'bake', 'fry', 'boil', 'simmer', 'instructions'],
            'weight': 2.5
        },
        'news_article': {
            'keywords': ['breaking news', 'news article', 'associated press', 'reuters', 'cnn', 'bbc', 
                        'news report', 'journalist', 'published', 'headline'],
            'weight': 2.0
        },
        'tutorial': {
            'keywords': ['tutorial', 'how to', 'step by step', 'beginner guide', 'for dummies', 'instructions'],
            'weight': 2.0
        },
        'entertainment': {
            'keywords': ['movie', 'film', 'actor', 'actress', 'screenplay', 'plot summary', 'netflix', 'imdb'],
            'weight': 2.0
        },
        'meme_cartoon': {
            'keywords': ['meme', 'comic', 'cartoon', 'joke', 'funny', 'laugh', 'hilarious'],
            'weight': 2.5
        },
    }
    
    non_business_score = 0
    detected_non_business_types = []
    
    for category, config in non_business_indicators.items():
        keywords = config['keywords']
        weight = config['weight']
        keyword_matches = sum(1 for kw in keywords if kw in text_lower)
        
        if keyword_matches >= 3:
            weighted_score = keyword_matches * weight
            non_business_score += weighted_score
            detected_non_business_types.append(f"{category}({keyword_matches})")
            print(f"   ⚠️  Detected: {category} - {keyword_matches} keywords, Score: {weighted_score:.1f}")
    
    print(f"   📊 Non-Business Score: {non_business_score:.1f}")
    
    if non_business_score > 10:
        error_msg = f"Document contains non-business content ({', '.join(set(detected_non_business_types))})"
        print(f"   ❌ REJECTED: {error_msg}")
        if request_id:
            write_error_to_firestore(request_id, 'NOT_BUSINESS_CONTENT', "This document does not appear to be a business document. Please upload startup pitch decks, financial models, or business-related documents.")
        return False, "NOT_BUSINESS_CONTENT", "This document does not appear to be a business document. Please upload startup pitch decks, financial models, or business-related documents."
    
    # ============================================================================
    # LAYER 3: BUSINESS CONTENT VERIFICATION
    # ============================================================================
    print(f"\n📋 LAYER 3: Business Content Verification")
    
    business_indicators = {
        'pitch_deck': {
            'keywords': ['pitch', 'startup', 'investment opportunity', 'funding round', 'series a',
                        'seed round', 'venture capital', 'investor', 'raise', 'seed funding'],
            'weight': 1.5
        },
        'financial': {
            'keywords': ['revenue', 'profit', 'loss', 'balance sheet', 'cash flow', 'ebitda',
                        'financial projection', 'forecast', 'budget', 'burn rate', 'arr', 'mrr', 'expenses'],
            'weight': 1.3
        },
        'market_analysis': {
            'keywords': ['market size', 'tam', 'sam', 'sop', 'competitive analysis', 
                        'market share', 'competitor', 'industry analysis', 'market opportunity'],
            'weight': 1.2
        },
        'product': {
            'keywords': ['product', 'feature', 'technology', 'platform', 'software', 'service',
                        'solution', 'development', 'engineering', 'product roadmap'],
            'weight': 1.0
        },
        'team': {
            'keywords': ['founder', 'ceo', 'team', 'experience', 'background', 'expertise', 'advisor',
                        'management team', 'leadership'],
            'weight': 1.1
        },
        'traction': {
            'keywords': ['user', 'customer', 'growth', 'metric', 'kpi', 'retention', 'acquisition',
                        'traction', 'milestone', 'achievement', 'users', 'monthly active'],
            'weight': 1.0
        },
    }
    
    business_score = 0
    detected_business_categories = []
    
    for category, config in business_indicators.items():
        keywords = config['keywords']
        weight = config['weight']
        keyword_matches = sum(1 for kw in keywords if kw in text_lower)
        
        if keyword_matches >= 1:
            weighted_score = keyword_matches * weight
            business_score += weighted_score
            detected_business_categories.append(f"{category}({keyword_matches})")
            print(f"   ✅ Detected: {category} - {keyword_matches} keywords, Score: {weighted_score:.1f}")
    
    print(f"   📊 Business Score: {business_score:.1f}")
    
    if business_score < 2:  # Require minimum business content
        print(f"   ❌ REJECTED: Insufficient business content (score: {business_score:.1f})")
        if request_id:
            write_error_to_firestore(request_id, 'INSUFFICIENT_BUSINESS_CONTENT', "Document does not contain enough business-related content. Please upload pitch decks, financial models, market research, or business documents.")
        return False, "INSUFFICIENT_BUSINESS_CONTENT", "Document does not contain enough business-related content. Please upload pitch decks, financial models, market research, or business documents."
    
    # ============================================================================
    # LAYER 4: PERSONAL vs BUSINESS RATIO CHECK
    # ============================================================================
    print(f"\n📋 LAYER 4: Personal vs Business Ratio Check")
    
    if business_score > 0:
        personal_business_ratio = personal_score / business_score
        print(f"   📊 Personal/Business Ratio: {personal_business_ratio:.2f}")
        
        if personal_business_ratio > 1.5 and personal_score > 5:  # Personal is >50% of business
            print(f"   ❌ REJECTED: Too much personal content mixed in")
            if request_id:
                write_error_to_firestore(request_id, 'MIXED_PERSONAL_BUSINESS', "Document contains a mix of personal and business content. Please upload pure business documents.")
            return False, "MIXED_PERSONAL_BUSINESS", "Document contains a mix of personal and business content. Please upload pure business documents."
    
    # ============================================================================
    # LAYER 5: CONTENT STRUCTURE ANALYSIS
    # ============================================================================
    print(f"\n📋 LAYER 5: Content Structure Analysis")
    
    # Check if document is too short
    word_count = len(full_text.split())
    print(f"   📊 Word Count: {word_count}")
    
    if word_count < 30:
        print(f"   ❌ REJECTED: Document too short")
        if request_id:
            write_error_to_firestore(request_id, 'INSUFFICIENT_CONTENT', "Document is too short to be a valid business document. Please upload documents with more detailed content.")
        return False, "INSUFFICIENT_CONTENT", "Document is too short to be a valid business document. Please upload documents with more detailed content."
    
    # Check for likely scanned ID (mostly short fields/numbers)
    lines = full_text.split('\n')
    very_short_lines = sum(1 for line in lines if len(line.strip()) < 20 and line.strip())
    short_line_ratio = very_short_lines / max(len(lines), 1)
    
    print(f"   📊 Short Lines Ratio: {short_line_ratio:.1%}")
    
    if short_line_ratio > 0.85:  # 70%+ very short lines
        print(f"   ❌ REJECTED: Likely structured form or ID")
        if request_id:
            write_error_to_firestore(request_id, 'LIKELY_STRUCTURED_DOCUMENT', "This appears to be a structured form or ID document, not a business document. Please upload proper business documents.")
        return False, "LIKELY_STRUCTURED_DOCUMENT", "This appears to be a structured form or ID document, not a business document. Please upload proper business documents."
    
    # ============================================================================
    # LAYER 6: OPTIONAL GEMINI SECONDARY CHECK (for edge cases)
    # ============================================================================
    # Only do secondary check if confidence is low (business_score between 4-6)
    
    if business_score < 3:
        print(f"\n📋 LAYER 6: Gemini Secondary Validation (Low Confidence)")
        
        try:
            is_business = gemini_document_type_check(full_text, business_score)
            
            if not is_business:
                print(f"   ❌ REJECTED: Gemini says not a business document")
                if request_id:
                    write_error_to_firestore(request_id, 'GEMINI_VALIDATION_FAILED', "AI analysis suggests this may not be a business document. Please verify and try again.")
                return False, "GEMINI_VALIDATION_FAILED", "AI analysis suggests this may not be a business document. Please verify and try again."
            else:
                print(f"   ✅ PASSED: Gemini confirms business document")
        except Exception as e:
            print(f"   ⚠️  Gemini check failed (non-blocking): {str(e)}")
            # Continue anyway if Gemini fails
    
    # ============================================================================
    # FINAL DECISION
    # ============================================================================
    print(f"\n{'='*60}")
    print(f"✅ VALIDATION PASSED - ALL LAYERS CLEARED")
    print(f"{'='*60}")
    print(f"📊 Final Scores:")
    print(f"   Personal: {personal_score:.1f}")
    print(f"   Business: {business_score:.1f}")
    print(f"   Non-Business: {non_business_score:.1f}")
    print(f"   Content Type: {', '.join(detected_business_categories)}")
    print(f"\n🔍 DEBUG SCORES:")
    print(f"   personal_score: {personal_score:.1f} (threshold: > 8.0)")
    print(f"   business_score: {business_score:.1f} (threshold: < 2)")
    print(f"   non_business_score: {non_business_score:.1f} (threshold: > 10.0)")
    print(f"   short_line_ratio: {short_line_ratio:.1%} (threshold: > 85%)")
    
    return True, "VALID", "Content validation passed - Valid business document"

def classify_document_type(extracted_text: str, filename: str) -> dict:
    """
    Classify document as PRIMARY or SUPPLEMENTARY
    PRIMARY: Can be analyzed alone (pitch deck, financial model, business plan)
    SUPPLEMENTARY: Needs other documents (resume, team profiles)
    """
    
    text_lower = extracted_text.lower()
    
    # Check for RESUME
    resume_keywords = ['objective:', 'work experience', 'skills section', 'education:', 
                      'references', 'cv', 'resume', 'curriculum vitae', 'employment history']
    resume_matches = sum(1 for kw in resume_keywords if kw in text_lower)
    if resume_matches >= 2:
        return {
            "type": "RESUME",
            "is_primary": False,
            "description": "Resume/CV - Supplementary document"
        }
    
    # Check for PITCH DECK
    pitch_keywords = ['pitch', 'startup', 'investment opportunity', 'funding round', 
                     'series a', 'seed round', 'venture capital', 'investor', 'raise']
    pitch_matches = sum(1 for kw in pitch_keywords if kw in text_lower)
    if pitch_matches >= 2:
        return {
            "type": "PITCH_DECK",
            "is_primary": True,
            "description": "Pitch Deck - Primary document"
        }
    
    # Check for FINANCIAL MODEL
    financial_keywords = ['revenue', 'profit', 'cash flow', 'budget', 'burn rate',
                         'financial projection', 'forecast', 'balance sheet', 'ebitda']
    financial_matches = sum(1 for kw in financial_keywords if kw in text_lower)
    if financial_matches >= 3:
        return {
            "type": "FINANCIAL_MODEL",
            "is_primary": True,
            "description": "Financial Model - Primary document"
        }
    
    # Check for BUSINESS PLAN
    business_keywords = ['business model', 'market analysis', 'competitive analysis',
                        'executive summary', 'operations plan', 'go-to-market']
    business_matches = sum(1 for kw in business_keywords if kw in text_lower)
    if business_matches >= 2:
        return {
            "type": "BUSINESS_PLAN",
            "is_primary": True,
            "description": "Business Plan - Primary document"
        }
    
    # Check for MARKET RESEARCH
    market_keywords = ['market size', 'competitors', 'industry analysis', 'market share',
                      'competitive landscape', 'market opportunity']
    market_matches = sum(1 for kw in market_keywords if kw in text_lower)
    if market_matches >= 2:
        return {
            "type": "MARKET_RESEARCH",
            "is_primary": True,
            "description": "Market Research - Primary document"
        }
    
    # Default: Uncertain
    return {
        "type": "UNKNOWN",
        "is_primary": False,
        "description": "Document type unclear"
    }

# ✅ NEW FUNCTION: Validate entire file set (not individual files)
def validate_file_set(all_extracted_data: list, file_names: list) -> tuple:
    """
    Validate entire set of uploaded files
    Returns: (is_valid, error_code, error_message)
    """
    
    if not all_extracted_data or len(all_extracted_data) == 0:
        return False, "NO_FILES", "No files to validate"
    
    has_primary_document = False
    has_supplementary_document = False
    document_types = []
    
    # Classify each file
    for i, extracted_data in enumerate(all_extracted_data):
        text = extracted_data.get('full_text', '')
        filename = file_names[i] if i < len(file_names) else f"file_{i}"
        
        doc_info = classify_document_type(text, filename)
        document_types.append(doc_info)
        
        if doc_info['is_primary']:
            has_primary_document = True
            print(f"   ✅ {filename}: {doc_info['description']}")
        else:
            has_supplementary_document = True
            print(f"   ⚠️  {filename}: {doc_info['description']}")
    
    # VALIDATION LOGIC
    
    # ❌ CASE 1: Only supplementary documents (e.g., resume alone)
    if has_supplementary_document and not has_primary_document:
        return False, "SUPPLEMENTARY_ONLY", \
            "Resume/Profile alone cannot be analyzed. Please upload a pitch deck, financial model, or business plan along with it."
    
    # ✅ CASE 2: Has primary document (with or without supplementary)
    if has_primary_document:
        return True, "VALID", "File set validation passed"
    
    # ❌ CASE 3: Unknown documents
    return False, "UNKNOWN_DOCUMENTS", \
        "Could not identify business documents. Please upload a pitch deck or financial model."

# Helper: Validate Gemini AI response structure
def validate_gemini_response(analysis):
    """Validate Gemini response structure"""
    required_fields = {
        'startupName': str,
        'industry': str,
        'stage': str,
        'recommendation': dict,
        'keyMetrics': list,
        'riskAssessment': list,
        'summaryContent': dict,
    }
    
    # Check for missing top-level fields
    missing_fields = []
    for field, field_type in required_fields.items():
        if field not in analysis:
            missing_fields.append(field)
        elif not analysis[field]:
            missing_fields.append(field)
    
    if missing_fields:
        return False, "INCOMPLETE_ANALYSIS", f"Gemini response missing: {', '.join(missing_fields)}"
    
    # Perform deeper validation on critical fields like recommendation score
    rec = analysis.get('recommendation', {})
    if 'text' not in rec or 'score' not in rec:
        return False, "INVALID_RECOMMENDATION", "Recommendation missing text or score"
    
    score = rec.get('score')
    if not isinstance(score, (int, float)) or score < 0 or score > 100:
        return False, "INVALID_SCORE", f"Recommendation score must be 0-100, got {score}"
    
    # Validate summary content
    summary = analysis.get('summaryContent', {})
    if not summary.get('businessOverview'):
        return False, "MISSING_BUSINESS_OVERVIEW", "Business overview is empty"
    
    return True, "VALID", "Gemini response validation passed"


def update_firestore_progress(request_id: str, step: int, message: str, percent: int, status: str = "in_progress"):
    """Write progress to Firestore"""
    try:
        db.collection('analysis_progress').document(request_id).set({
            'step': step,
            'message': message,
            'percent': percent,
            'status': status,
            'timestamp': datetime.now().isoformat()
        }, merge=True)
        print(f"📊 Firestore: Step {step}/6 - {percent}%")
    except Exception as e:
        print(f"⚠️  Firestore error: {str(e)}")


def write_error_to_firestore(request_id: str, error_code: str, error_message: str):
    """Write validation error to Firestore"""
    try:
        db.collection('analysis_progress').document(request_id).set({
            'step': 1,
            'status': 'failed',
            'error_code': error_code,
            'error_message': error_message,
            'timestamp': datetime.now().isoformat()
        })
        print(f"📊 Error logged to Firestore: {error_code}")
    except Exception as e:
        print(f"⚠️  Firestore error write failed: {str(e)}")


# =============================================================================
# MAIN CLOUD FUNCTION
# =============================================================================

@rate_limit(max_requests=10, time_window=60)
@functions_framework.http
def analyze_document(request: Request):
    """Production Investment Analysis Cloud Function"""
    
    cors_headers = get_cors_headers()
    
    # Generate request ID
    request_id = str(uuid.uuid4())
    print(f"🔑 Request ID: {request_id}")
    
    try:
        db.collection('analysis_progress').document(request_id).set({
            'step': 0,
            'message': 'Starting analysis...',
            'percent': 0,
            'status': 'in_progress',
            'timestamp': datetime.now().isoformat()
        })
    except:
        pass

    try:
        # Handle CORS preflight
        if request.method == 'OPTIONS':
            print("🔔 CORS preflight request")
            headers = get_cors_headers(include_content_type=False)
            return ('', 204, headers)
        
        # Health check endpoint
        if request.args.get('health') == 'true':
            return health_check(request)
        
        print(f"\n{'='*80}")
        print(f"🚀 STARTUP ANALYSIS REQUEST RECEIVED")
        print("="*80)
        print(f"📅 Timestamp: {datetime.now().isoformat()}")
        print(f"📍 Project: {PROJECT_ID} | Location: {LOCATION}")
        print(f"📄 Content-Type: {request.content_type}")
        
        # =====================================================================
        # VALIDATE REQUEST FORMAT
        # =====================================================================
        if not request.content_type or 'multipart/form-data' not in request.content_type:
            print(f"❌ Invalid request - must be multipart/form-data")
            error_result = {
                "status": "error",
                "error_type": "InvalidRequestError",
                "code": "INVALID_REQUEST_FORMAT",
                "message": "Request must be multipart/form-data with 'documents' field",
                "suggestion": "Ensure you're sending files as multipart/form-data with field name 'documents'",
                "timestamp": datetime.now().isoformat()
            }
            return (json.dumps(error_result), 400, cors_headers)
        
        # =====================================================================
        # GET FILES FROM REQUEST
        # =====================================================================
        files = request.files.getlist('documents')
        
        if not files:
            print("❌ No files found in 'documents' field")
            error_result = {
                "status": "error",
                "error_type": "MissingFilesError",
                "code": "FILE_NOT_PROVIDED",
                "message": "No files found. Submit files using 'documents' form field.",
                "suggestion": "Please select at least one PDF or document file to analyze",
                "timestamp": datetime.now().isoformat()
            }
            return (json.dumps(error_result), 400, cors_headers)
        
        print(f"📁 Found {len(files)} file(s): {[f.filename for f in files]}")
        
        # =====================================================================
        # PROCESS EACH FILE
        # =====================================================================
        file_names = []
        processed_files_info = []
        all_extracted_data = []
        validation_errors = []
        
        for file in files:
            if not file or not file.filename:
                print(f"⚠️ Skipping invalid file entry")
                continue
            
            print(f"\n📄 Processing: {file.filename}")
            
            # Read file content ONCE
            file_bytes = file.read()
            file_size = len(file_bytes)
            print(f"   Size: {file_size / 1024:.1f}KB")
            
            # Validate file size
            if file_size > MAX_FILE_SIZE:
                size_mb = file_size / (1024 * 1024)
                print(f"❌ File too large: {size_mb:.1f}MB (max {MAX_FILE_SIZE / (1024 * 1024):.0f}MB)")
                validation_errors.append({
                    "filename": file.filename,
                    "error": "FILE_TOO_LARGE",
                    "message": f"File is {size_mb:.1f}MB. Maximum 50MB allowed"
                })
                continue
            
            # Validate file is not empty
            if file_size == 0:
                print(f"❌ File is empty")
                validation_errors.append({
                    "filename": file.filename,
                    "error": "EMPTY_FILE",
                    "message": "File is empty"
                })
                continue
            
            # Validate file extension
            ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
            if not ext or ext not in ALLOWED_EXTENSIONS:
                print(f"❌ Invalid file type: .{ext}")
                validation_errors.append({
                    "filename": file.filename,
                    "error": "INVALID_FILE_TYPE",
                    "message": f"File type '.{ext}' not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
                })
                continue
            
            # Verify file magic bytes (security check)
            is_valid_signature, sig_code, sig_msg = verify_file_magic_bytes(file_bytes, file.filename)
            if not is_valid_signature:
                print(f"❌ Invalid file signature: {sig_msg}")
                validation_errors.append({
                    "filename": file.filename,
                    "error": sig_code,
                    "message": sig_msg
                })
                continue
            
            print(f"✅ File validation passed")
            
            try:
                # Encode file bytes to base64
                file_content_base64 = base64.b64encode(file_bytes).decode('utf-8')
                
                # Extract text using Document AI
                print(f"   🔤 Sending to Document AI for processing...")
                extracted_data = extract_with_document_ai(file_content_base64, file.filename)
                
                if "error" in extracted_data:
                    print(f"❌ Extraction failed: {extracted_data.get('error')}")
                    validation_errors.append({
                        "filename": file.filename,
                        "error": "EXTRACTION_FAILED",
                        "message": extracted_data.get('error', 'Unknown extraction error')
                    })
                    continue
                
                # Validate extracted content
                is_valid, error_code, error_msg = validate_extraction(extracted_data, request_id)
                if not is_valid:
                    print(f"❌ Extraction validation failed: {error_msg}")
                    validation_errors.append({
                        "filename": file.filename,
                        "error": error_code,
                        "message": error_msg,
                        "document_type": extracted_data.get('document_classification', {}).get('type', 'UNKNOWN'),
                        "is_primary": extracted_data.get('document_classification', {}).get('is_primary', False)
                    })
                    continue
                
                # File processed successfully
                file_names.append(file.filename)
                processed_files_info.append({
                    "name": file.filename,
                    "type": get_document_type(file.filename),
                    "pages": extracted_data.get("page_count", 0),
                    "size": file_size,
                })
                
                extracted_data["file_name"] = file.filename
                all_extracted_data.append(extracted_data)
                print(f"✅ File processed successfully: {extracted_data.get('page_count', 0)} pages")
                update_firestore_progress(request_id, 1, "Extracting text from documents", 15)
                
            except Exception as file_error:
                print(f"❌ Error processing file: {str(file_error)}")
                validation_errors.append({
                    "filename": file.filename,
                    "error": "PROCESSING_ERROR",
                    "message": str(file_error)
                })
                continue
        
        # =====================================================================
        # CHECK IF ANY FILES WERE SUCCESSFULLY PROCESSED
        # =====================================================================
        if not all_extracted_data:
            print(f"❌ No valid files could be processed")
            error_result = {
                "status": "error",
                "error_type": "ExtractionError",
                "code": "NO_VALID_FILES",
                "message": "No valid files could be processed",
                "details": validation_errors,
                "timestamp": datetime.now().isoformat()
            }
            return (json.dumps(error_result), 400, cors_headers)
        
        # =====================================================================
        # VALIDATE FILE SET
        # =====================================================================
        print(f"\n📋 VALIDATING FILE SET ({len(all_extracted_data)} files)")
        is_valid_set, set_code, set_msg = validate_file_set(all_extracted_data, file_names)
        
        if not is_valid_set:
            print(f"❌ File set validation failed: {set_msg}")
            if request_id:
                write_error_to_firestore(request_id, set_code, set_msg)
            error_result = {
                "status": "error",
                "error_type": "FileSetValidationError",
                "code": set_code,
                "message": set_msg,
                "timestamp": datetime.now().isoformat()
            }
            return (json.dumps(error_result), 400, cors_headers)
        
        print(f"✅ File set validation passed")
        update_firestore_progress(request_id, 2, "Analyzing pitch deck content", 25)
        
        # =====================================================================
        # COMBINE MULTIPLE DOCUMENTS IF NEEDED
        # =====================================================================
        if len(all_extracted_data) > 1:
            print(f"\n🔚 Combining {len(all_extracted_data)} documents for analysis")
            combined_text = "\n\n---DOCUMENT_BREAK---\n\n".join([
                f"[{data.get('file_name', 'Document')}]\n" + data.get("full_text", "")
                for data in all_extracted_data
            ])
            extracted_data = {
                "full_text": combined_text,
                "page_count": sum(d.get("page_count", 0) for d in all_extracted_data),
                "file_names": file_names,
                "processing_method": "multi_document"
            }
        else:
            extracted_data = all_extracted_data[0]
        
        print(f"\n✅ Extraction successful")
        print(f"   Pages: {extracted_data.get('page_count')}")
        print(f"   Text length: {len(extracted_data.get('full_text', ''))} characters")
        
        # =====================================================================
        # GET SECTOR PARAMETER
        # =====================================================================
        sector = request.form.get('sector') or request.form.get('category') or 'other'
        valid_sectors = ['saas', 'fintech', 'healthtech', 'edtech', 'ai', 'ecommerce', 'mobility', 'climate', 'consumer', 'other']
        if sector.lower() not in valid_sectors:
            sector = 'other'
        print(f"🏭 Sector received: {sector}")
        
        # =====================================================================
        # ANALYZE WITH GEMINI
        # =====================================================================
        print(f"\n🧠 ANALYZING WITH GEMINI")
        update_firestore_progress(request_id, 3, "Analyzing business model and strategy", 40)
        analysis = analyze_investment_opportunity(extracted_data, file_names, sector)
        
        if "error" in analysis:
            print(f"❌ Analysis error: {analysis.get('error')}")
            error_result = {
                "status": "error",
                "error_type": "AnalysisError",
                "code": "GEMINI_ANALYSIS_FAILED",
                "message": f"Gemini analysis failed: {analysis.get('error')}",
                "suggestion": "Try again. If the issue persists, contact support",
                "timestamp": datetime.now().isoformat()
            }
            return (json.dumps(error_result), 500, cors_headers)
        
        print(f"✅ Gemini analysis successful")
        
        # =====================================================================
        # CREATE PAGE MAPS
        # =====================================================================
        page_maps = create_page_map_from_text(
            extracted_data.get("full_text", ""),
            extracted_data.get("file_name", "document.pdf")
        )
        
        # =====================================================================
        # BUILD FINAL RESPONSE
        # =====================================================================
        model_used = analysis.get("ai_model_used", "gemini-1.5-flash")
        
        result = {
            "startupName": analysis.get("startupName", "Unknown Company"),
            "industry": analysis.get("industry", ""),
            "stage": analysis.get("stage", ""),
            "analysisDate": datetime.now().isoformat(),
            
            "recommendation": {
                "text": analysis.get("recommendation", {}).get("text", "REVIEW"),
                "score": int(analysis.get("recommendation", {}).get("score", 0)),
                "justification": analysis.get("recommendation", {}).get("justification", "")
            },
            
            "keyMetrics": analysis.get("keyMetrics", []),
            "riskAssessment": analysis.get("riskAssessment", []),
            
            "summaryContent": {
                "businessOverview": analysis.get("summaryContent", {}).get("businessOverview", ""),
                "teamExperience": analysis.get("summaryContent", {}).get("teamExperience", ""),
                "productTech": analysis.get("summaryContent", {}).get("productTech", "")
            },
            
            "competitiveAnalysis": analysis.get("competitiveAnalysis", []),
            "marketOpportunity": analysis.get("marketOpportunity", {}),
            "financialProjections": analysis.get("financialProjections", []),
            "valuationInsights": analysis.get("valuationInsights", {}),
            "investmentTerms": analysis.get("investmentTerms", {}),
            "crossDocumentInsights": analysis.get("crossDocumentInsights", []),
            
            "page_maps": page_maps if page_maps else [],
            "documentsAnalyzed": processed_files_info if processed_files_info else [],
            "analysisMetadata": {
                "aiModel": model_used,
                "documentsProcessed": len(file_names),
                "analysisDepth": "comprehensive",
                "crossValidationPerformed": len(file_names) > 1,
                "processingTime": "real-time",
                "processingMethod": extracted_data.get("processing_method", "online_imageless")
            }
        }
        
        update_firestore_progress(request_id, 6, "Generating deal memo", 100)
        
        try:
            db.collection('analysis_progress').document(request_id).update({
                'status': 'completed'
            })
        except:
            pass
        
        print(f"\nâœ… ANALYSIS COMPLETE")
        print("="*80)
        result['request_id'] = request_id
        return (json.dumps(result), 200, cors_headers)
    
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        if 'request_id' in locals():
            write_error_to_firestore(request_id, 'INTERNAL_ERROR', str(e))
        import traceback
        traceback.print_exc()
        
        error_result = {
            "status": "error",
            "error_type": type(e).__name__,
            "code": "INTERNAL_ERROR",
            "message": str(e),
            "suggestion": "An unexpected error occurred. Please try again or contact support",
            "timestamp": datetime.now().isoformat()
        }
        print("="*80)
        return (json.dumps(error_result), 500, cors_headers)


# =============================================================================
# DOCUMENT EXTRACTION LOGIC
# =============================================================================


# This function is responsible for extracting text from a document using Document AI.
# It handles both small files (online processing) and large files (batch processing).
def extract_with_document_ai(pdf_content_base64: str, filename: str) -> dict:
    """Extract text from PDF using Document AI with OCR support and automatic batch fallback"""
  
   # The main logic is wrapped in a try/except block to catch errors, especially the page limit error.
    try:
        print(f"   → Decoding PDF...")
        pdf_bytes = base64.b64decode(pdf_content_base64) # The file content is received as a Base64 encoded string. This line decodes it back into raw binary bytes.
        print(f"   → Decoded size: {len(pdf_bytes)} bytes")
        
        print(f"\n{'='*60}")
        print(f"📄 EXTRACTING: {filename}")
        print(f"{'='*60}")

       # This constructs the full resource name for the Document AI processor, which is required by the API.
        # It uses the PROJECT_ID, PROCESSOR_LOCATION, and PROCESSOR_ID defined at the top of the script.
        name = docai_client.processor_path(PROJECT_ID, PROCESSOR_LOCATION, PROCESSOR_ID)
        # Log the processor name being used.
        print(f"   → Processor: {name}")
        
        print(f"   → Attempting ONLINE processing (max {MAX_ONLINE_PAGES} pages for OCR, {MAX_IMAGELESS_PAGES} for imageless)...")
        
      # Configure the OCR settings for the Document AI request.
        ocr_config = documentai.OcrConfig(
            # This is where the USE_OCR flag is used. It tells Document AI whether to perform OCR.
            #enable_ocr=USE_OCR,
            # This enables Document AI to parse the native structure of the PDF, which can improve layout understanding.
            enable_native_pdf_parsing=True,
            # If OCR is OFF (!USE_OCR), this tells Document AI to use the PDF's embedded digital text.
            #use_native_text=not USE_OCR,
            # Image quality scores are not needed for this use case, so it's disabled for efficiency.
            enable_image_quality_scores=False
        )
        
        # This creates the main request object to send to the Document AI API.
        request = documentai.ProcessRequest(
            # Specifies which processor to use.
            name=name,
            # Contains the actual document content.
            raw_document=documentai.RawDocument(
                # The binary content of the PDF file.
                content=pdf_bytes,
                # The MIME type of the file, telling the API it's a PDF.
                mime_type="application/pdf"
            ),
            # Attaches the processing options, including our OCR configuration.
            process_options=documentai.ProcessOptions(
                ocr_config=ocr_config
            ),
            # This tells Document AI not to wait for a human to review the document, ensuring a fully automated process.
            skip_human_review=True,
        )
       
        result = docai_client.process_document(request=request) # This is the actual API call to process the document synchronously (online).
        document = result.document  # The result object contains the processed document.

        page_count = len(document.pages) if document.pages else 0
        text_length = len(document.text or "")

        print(f"📄 EXTRACTION COMPLETE - DEBUG INFO:")
        print(f"   Total pages in PDF: {page_count}")
        print(f"   Text extracted: {len(document.text or '')} characters")
        print(f"   Average chars per page: {len(document.text or '') // max(page_count, 1)}")
        print(f"   Processing method used: ONLINE")
        print(f"   First 500 chars of extracted text:")
        print(f"   {(document.text or '')[:500]}")
        print(f"   Last 500 chars of extracted text:")
        print(f"   {(document.text or '')[-500:]}")
        extracted_text = document.text or ''
        if len(extracted_text) > 1000:
            print(f"   First 300 chars: {extracted_text[:300]}")
            print(f"   Last 300 chars: {extracted_text[-300:]}")
        else:
            print(f"   Full text: {extracted_text}")


        print(f"✅ ONLINE processing SUCCESSFUL")
        print(f"   Pages extracted: {page_count}")
        print(f"   Text characters: {text_length}")
        print(f"   Avg chars per page: {text_length // max(page_count, 1)}")
        
        # Check for blank pages
        blank_pages = 0
        for i, page in enumerate(document.pages or []):
            if not page or len(str(page)) < 50:
                blank_pages += 1
        
        if blank_pages > 0:
            print(f"📌 Found {blank_pages} blank/minimal pages out of {page_count}")
        
        processing_mode = "OCR" if USE_OCR else "Imageless"
        print(f"   ✅ Online processing successful ({processing_mode}): {len(document.pages)} pages")
        
       # Return a dictionary containing the extracted text, page count, and the processing method used.
        return {
            "full_text": document.text or "",
            "page_count": len(document.pages),
            "processing_method": f"online_{processing_mode.lower()}",
        }
    
    except Exception as e:
        error_str = str(e)
        if "PAGE_LIMIT_EXCEEDED" in error_str or "non-imageless" in error_str or "exceed" in error_str.lower():
            print(f"   ⚠️ Online processing failed - Document exceeds page limit")
            print(f"   → Document has >15 pages (OCR) or >30 pages (imageless)")
            print(f"   → Initiating BATCH processing for large document...")
            try:
                return batch_process_document(pdf_bytes, filename)
            except Exception as batch_error:
                print(f"   ❌ Batch processing also failed: {str(batch_error)}")
                raise batch_error
        else:
            print(f"   ❌ Document AI error: {error_str}")
            raise e


def batch_process_document(pdf_bytes: bytes, filename: str) -> dict:
    """Batch process large PDFs (>30 pages) using GCS - FIXED API"""
    try:
        from datetime import datetime as dt

        print(f"\n{'='*60}")
        print(f"🔄 BATCH PROCESSING: {filename}")
        print(f"{'='*60}")
        
        timestamp = dt.now().strftime("%Y%m%d-%H%M%S%f")
        input_blob_name = f"input-{timestamp}.pdf"
        
        print(f"   → Uploading to input bucket: {INPUT_BUCKET_NAME}")
        input_bucket = storage_client.bucket(INPUT_BUCKET_NAME)
        input_blob = input_bucket.blob(input_blob_name)
        input_blob.upload_from_string(pdf_bytes, content_type="application/pdf")
        print(f"   ✅ Uploaded: {input_blob_name}")
        
        gcs_input_uri = f"gs://{INPUT_BUCKET_NAME}/{input_blob_name}"
        gcs_output_uri_prefix = f"output-{timestamp}"
        gcs_output_uri = f"gs://{OUTPUT_BUCKET_NAME}/{gcs_output_uri_prefix}/"
        
        print(f"   → Submitting batch job to Document AI...")
        print(f"   Input: {gcs_input_uri}")
        print(f"   Output: {gcs_output_uri}")
        
        # ✅ FIXED: Use correct API for current Document AI library
        # Old API: GcsOutputConfig (doesn't exist in current version)
        # New API: Use proper request structure
        
        name = docai_client.processor_path(PROJECT_ID, PROCESSOR_LOCATION, PROCESSOR_ID)
        
        # Configure batch input
        input_config = documentai.BatchDocumentsInputConfig(
            gcs_documents=documentai.GcsDocuments(
                documents=[
                    documentai.GcsDocument(
                        gcs_uri=gcs_input_uri,
                        mime_type="application/pdf"
                    )
                ]
            )
        )
        
        # ✅ FIXED: Use correct output config format
        output_config = documentai.DocumentOutputConfig(
            gcs_output_config=documentai.DocumentOutputConfig.GcsOutputConfig(
                gcs_uri=gcs_output_uri
            )
        )
        
        request = documentai.BatchProcessRequest(
            name=name,
            input_documents=input_config,
            document_output_config=output_config,
        )
        
        print(f"   → Batch job running (this may take a few minutes)...")
        operation = docai_client.batch_process_documents(request=request)
        
        # Wait for operation to complete
        print(f"   → Waiting for batch processing to complete...")
        operation.result(timeout=900)  # Wait up to 15 minutes
        
        print(f"   ✅ Batch job completed")
        
        # Retrieve results
        print(f"   → Retrieving results from output bucket...")
        output_bucket = storage_client.bucket(OUTPUT_BUCKET_NAME)
        output_blobs = list(output_bucket.list_blobs(prefix=gcs_output_uri_prefix))
        
        if not output_blobs:
            raise Exception(f"No output files found in GCS. Check if bucket {OUTPUT_BUCKET_NAME} exists and batch job produced output.")
        
        print(f"   Found {len(output_blobs)} output files")
        
        # Find the JSON result file
        json_blobs = [b for b in output_blobs if b.name.endswith(".json")]

        if not json_blobs:
            raise Exception("Could not find any JSON output files from batch processing.")

        print(f"   Found {len(json_blobs)} JSON output file(s)")

        all_pages = []
        all_text = ""

        # Sort by blob name to read in order
        for json_blob in sorted(json_blobs, key=lambda b: b.name):
            print(f"   → Reading {json_blob.name}...")
            json_string = json_blob.download_as_string()
            document = documentai.Document.from_json(json_string)
            
            # Collect pages and text from this file
            if document.pages:
                all_pages.extend(document.pages)
            if document.text:
                all_text += "\n" + document.text

        page_count = len(all_pages)
        extracted_text = all_text

        print(f"✅ BATCH extraction SUCCESSFUL")
        print(f"   Total JSON files read: {len(json_blobs)}")
        print(f"   Pages extracted: {page_count}")
        print(f"   Text characters: {len(extracted_text)}")
                
        # Check for blank pages
        blank_pages = 0
        for i, page in enumerate(document.pages or []):
            if not page or len(str(page)) < 50:
                blank_pages += 1
        
        if blank_pages > 0:
            print(f"📌 Found {blank_pages} blank/minimal pages out of {page_count}")


        # Cleanup GCS files
        print(f"   → Cleaning up GCS files...")
        try:
            input_blob.delete()
            for blob in output_blobs:
                blob.delete()
            print(f"   ✅ Cleanup complete")
        except Exception as cleanup_error:
            print(f"   ⚠️ Warning: Cleanup failed (non-critical): {cleanup_error}")
        
        return {
            "full_text": extracted_text,
            "page_count": page_count,
            "processing_method": "batch_ocr",
        }
    
    except Exception as e:
        print(f"   ❌ Batch processing failed: {str(e)}")
        print(f"   Suggestions:")
        print(f"   1. Verify GCS buckets exist: {INPUT_BUCKET_NAME}, {OUTPUT_BUCKET_NAME}")
        print(f"   2. Check Cloud Function has Storage permissions")
        print(f"   3. Verify Document AI has access to GCS")
        raise e
# =============================================================================
# GEMINI ANALYSIS
# =============================================================================

# ✅ NEW: Gemini Secondary Validation for Edge Cases
def gemini_document_type_check(text: str, business_score: float) -> bool:
    """
    Use Gemini to verify if document is actually a business document
    Only called when confidence is low (4-6 score range)
    """
    try:
        print(f"   → Initializing Gemini for secondary check...")
        
        # Use fastest model available
        models_to_try = ["gemini-1.5-flash", "gemini-2.0-flash"]
        model = None
        
        for model_name in models_to_try:
            try:
                model = GenerativeModel(model_name)
                # Quick test
                model.generate_content("test", generation_config={"max_output_tokens": 2})
                print(f"   → Using {model_name} for validation")
                break
            except:
                continue
        
        if not model:
            print(f"   ⚠️  No Gemini models available for secondary check")
            return business_score >= 4  # Fall back to score threshold
        
        prompt = f"""You are a document classifier. Analyze this text ONLY.

Is this a BUSINESS DOCUMENT (pitch deck, financial model, market analysis, business plan, etc)?
Answer ONLY with: YES or NO

Text (first 2000 chars):
{text[:2000]}

Rules:
- YES: If document is about a startup, business, products, finances, market analysis, etc.
- NO: If document is personal (ID, resume, medical, news, recipe, entertainment, etc.)
- Answer ONLY: YES or NO (nothing else)
"""
        
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.1,
                "max_output_tokens": 10,
            }
        )
        
        response_text = response.text.strip().upper() if hasattr(response, 'text') else ""
        
        print(f"   → Gemini Response: {response_text}")
        
        if "YES" in response_text:
            return True
        else:
            return False
            
    except Exception as e:
        print(f"   ⚠️  Gemini secondary check error: {str(e)}")
        return business_score >= 4  # Fall back to score threshold

def analyze_investment_opportunity(extracted_data: dict, file_names: list = [], sector: str = None, request_id: str = None) -> dict:
    """Real investment analysis using Gemini - FIXED JSON parsing"""
    try:
        if "error" in extracted_data:
            return {"error": "Cannot analyze - extraction failed"}
        
        print(f"   → Initializing Gemini...")
        
        # Try models in priority order
        models_to_try = [
            "gemini-2.0-flash",
            "gemini-2.5-flash", 
            "gemini-1.5-flash",
            "gemini-2.5-pro",
            "gemini-1.5-pro",
        ]
        
        model = None
        model_used = None
        
        for model_name in models_to_try:
            try:
                print(f"   → Testing {model_name}...")
                model = GenerativeModel(model_name)
                test_response = model.generate_content(
                    "test",
                    generation_config={"max_output_tokens": 2}
                )
                model_used = model_name
                print(f"   ✅ Using {model_name}")
                break
            except Exception as e:
                print(f"   ⚠️ {model_name} unavailable: {str(e)}")
                continue
        
        if not model:
            raise Exception("No Gemini models available in this region")
        
        full_text = extracted_data.get('full_text', '')
        page_count = extracted_data.get('page_count', 0)
        doc_names = ", ".join(file_names) if file_names else "uploaded document"
        
        print(f"   → Analyzing {page_count} pages with {model_used}...")
        
         # ✅ SECURITY: Escape Gemini input
        full_text_escaped = escape_gemini_input(full_text)

        # Build analysis prompt - SIMPLIFIED FOR RELIABILITY
# REPLACE the analyze_investment_opportunity() function prompt section with this:

        sector_context = f"This is a {get_industry_from_sector(sector)} startup" if sector else "This is a technology startup"

        # Build analysis prompt - ENHANCED TO EXTRACT ALL DATA
        prompt = f"""You are a senior venture capital analyst. {sector_context}. Analyze this startup document and extract ALL available investment data.

DOCUMENT INFO:
- Documents: {doc_names}
- Pages: {page_count}

DOCUMENT CONTENT:
{full_text_escaped[:100000]}

Return ONLY this JSON structure. Fill in EVERY field with data from the document. If data is not available, use "Not specified in document" or empty array [].

{{
  "startupName": "Company name from document",
  "industry": "Industry type",
  "stage": "Funding stage (Seed/Series A/etc)",
  "recommendation": {{
    "text": "INVEST or PASS or REVIEW",
    "score": 0-100,
    "justification": "Why this score based on document"
  }},
  
  "keyMetrics": [
    {{
      "label": "Metric name",
      "value": "Value with units",
      "source": {{
        "type": "document",
        "location": "Page X or Section Y",
        "confidence": "high/medium/low",
        "details": "How this was extracted"
      }}
    }}
  ],
  
  "riskAssessment": [
    {{
      "type": "market-risk/execution-risk/financial-risk/technical-risk",
      "level": "high/medium/low",
      "title": "Risk title",
      "description": "Risk description from document",
      "mitigation": "How to mitigate",
      "impact": "Potential impact if risk occurs"
    }}
  ],
  
  "summaryContent": {{
    "businessOverview": "Full description of what company does, their problem statement, and solution",
    "teamExperience": "Detailed team background, founders' experience, past companies, expertise areas",
    "productTech": "Product features, technology stack, differentiation, how it works"
  }},
  
  "competitiveAnalysis": [
    {{
      "competitor": "Competitor company name",
      "differentiators": "How target company differs from this competitor",
      "marketShare": "Market position/share if mentioned",
      "strengths": "Competitor strengths mentioned in document",
      "weaknesses": "How target company is better"
    }}
  ],
  
  "marketOpportunity": {{
    "TAM": "Total Addressable Market (exact number if in document, e.g. $300B)",
    "SAM": "Serviceable Addressable Market",
    "SOM": "Serviceable Obtainable Market or initial target",
    "growthRate": "Market growth rate with CAGR if mentioned",
    "marketTrends": "Industry trends mentioned in document",
    "entryBarriers": "Barriers to entry mentioned"
  }},
  
  "financialProjections": [
    {{
      "year": "Year (2025, 2026, etc)",
      "revenue": "Projected revenue (e.g., $400k, $2M)",
      "expenses": "Projected expenses if mentioned",
      "margins": "Gross/Net margins if mentioned",
      "metrics": "Other financial metrics (customers, ARR, MRR, etc)",
      "source": "Where in document this appears"
    }}
  ],
  
  "valuationInsights": {{
    "currentValuation": "Current valuation if mentioned",
    "post_moneyValuation": "Post-money valuation",
    "pricingPerShare": "Price per share if in SAFE/equity round",
    "comparableCompanies": "Comparable companies for valuation benchmarking",
    "keyMetricsForValuation": "Metrics used to justify valuation (revenue multiples, user growth, etc)"
  }},
  
  "investmentTerms": {{
    "roundType": "Seed/Series A/Series B/SAFE/Convertible Note/etc",
    "requestedAmount": "Funding amount requested (e.g., $5M)",
    "equity": "Equity percentage offered if specified",
    "minimumInvestment": "Minimum check size if specified",
    "useOfFunds": "How funds will be used (product dev %, marketing %, hiring %)",
    "fundingTimeline": "When they need funds by"
  }},
  
  "traction": {{
    "customers": "Current customers or logos",
    "revenue": "Current revenue or MRR",
    "users": "User count or growth",
    "partnerships": "Strategic partnerships",
    "awards": "Awards or recognitions",
    "media": "Press mentions or publications"
  }},
  
  "crossDocumentInsights": [
    {{
      "type": "consistency/contradiction/opportunity/concern",
      "title": "Insight title",
      "description": "If multiple docs analyzed, what connects them",
      "confidence": "high/medium/low",
      "status": "verified/needs_clarification"
    }}
  ]
}}

CRITICAL RULES:
1. Extract EXACT data from document - no assumptions
2. If data not in document, use "Not specified in document" or leave empty []
3. For financials, include units ($, %, numbers)
4. Include page numbers or section names for source verification
5. For charts: Include revenue projections, growth rates, burn rate if available
6. Return ONLY valid JSON, no markdown, no explanations
7. All monetary values keep currency symbols
8. All percentage values include % symbol
9. confidence should be "high" only if explicitly stated in document"""

        print(f"   → Sending to Gemini...")
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.1,
                "max_output_tokens": 8192,  # Increased for more data
            }
        )
        
        # ✅ FIXED: Better response validation
        if not response:
            raise ValueError("Gemini returned empty response")
        
        response_text = response.text.strip() if hasattr(response, 'text') else str(response)
        
        if not response_text:
            raise ValueError("Gemini returned empty text")
        
        print(f"   → Response received ({len(response_text)} characters)")
        
        # ✅ FIXED: Better JSON extraction
        print(f"   → Parsing JSON response...")
        
        # Try to extract JSON from markdown code blocks first
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', response_text)
        if json_match:
            json_str = json_match.group(1).strip()
            print(f"   → Extracted JSON from markdown block")
        else:
            # Try to find JSON object directly
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                json_str = json_match.group(0)
                print(f"   → Extracted JSON from response")
            else:
                json_str = response_text
        
        # ✅ FIXED: Check if we actually have JSON before parsing
        if not json_str or json_str.isspace():
            print(f"   ❌ No JSON found in response:")
            print(f"   Response text: {response_text[:500]}")
            raise ValueError(f"Could not extract JSON from response. Got: {response_text[:200]}")
        
        # Try to parse JSON
        try:
            analysis = json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"   ❌ JSON parse error: {str(e)}")
            print(f"   Attempted to parse: {json_str[:300]}")
            raise ValueError(f"Failed to parse Gemini JSON: {str(e)}")
        
        # ✅ FIXED: Validate required fields exist
        required_fields = ['startupName', 'recommendation', 'summaryContent']
        missing_fields = [f for f in required_fields if f not in analysis]
        if missing_fields:
            print(f"   ⚠️ Missing fields: {missing_fields}")
            # Provide defaults instead of failing
            if 'startupName' not in analysis:
                analysis['startupName'] = 'Unknown Company'
            if 'recommendation' not in analysis:
                analysis['recommendation'] = {'text': 'REVIEW', 'score': 50, 'justification': 'Incomplete analysis'}
            if 'summaryContent' not in analysis:
                analysis['summaryContent'] = {
                    'businessOverview': 'Not available',
                    'teamExperience': 'Not available',
                    'productTech': 'Not available'
                }
        
        # Add metadata
        analysis["ai_model_used"] = model_used
        analysis["sector"] = sector
        analysis["industry"] = get_industry_from_sector(sector)
        
        print(f"   ✅ Analysis parsed successfully")
        print(f"   → Startup: {analysis.get('startupName', 'Unknown')}")
        print(f"   → Recommendation: {analysis.get('recommendation', {}).get('text', 'Unknown')} ({analysis.get('recommendation', {}).get('score', 0)}/100)")
        if request_id:
            update_firestore_progress(request_id, 5, "Benchmarking against market data", 85)


        return analysis
    
    except ValueError as e:
        print(f"   ❌ Value error in analysis: {str(e)}")
        raise e
    
    except Exception as e:
        print(f"   ❌ Gemini analysis failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise e

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def create_page_map_from_text(text: str, filename: str) -> list:
    """Create page map from text"""
    if not text or len(text) < 10:
        return []
    
    parts = text.split("---DOCUMENT_BREAK---")
    page_maps = []
    
    for i, part in enumerate(parts):
        if not part.strip():
            continue
        
        page_maps.append({
            "page_number": i + 1,
            "file_name": filename,
            "text_preview": part.strip()[:200] + "..." if len(part.strip()) > 200 else part.strip()
        })
    
    return page_maps


def get_document_type(filename: str) -> str:
    """Determine document type from filename"""
    filename = filename.lower()
    
    if any(x in filename for x in ['pitch', 'deck', 'presentation']):
        return 'pitchDeck'
    elif any(x in filename for x in ['financial', 'model', 'finance']):
        return 'financialModel'
    elif any(x in filename for x in ['founder', 'team', 'profile']):
        return 'founderProfiles'
    elif any(x in filename for x in ['market', 'research', 'analysis']):
        return 'marketResearch'
    elif any(x in filename for x in ['traction', 'metric', 'growth']):
        return 'tractionData'
    else:
        return 'document'


def get_industry_from_sector(sector: str) -> str:
    """Map sector code to industry display name"""
    sector_map = {
        'saas': 'Software as a Service',
        'fintech': 'Financial Technology',
        'healthtech': 'Healthcare & Medical Technology',
        'edtech': 'Education Technology',
        'ai': 'Artificial Intelligence & Machine Learning',
        'ecommerce': 'E-Commerce & Direct-to-Consumer',
        'mobility': 'Mobility & Transportation',
        'climate': 'Climate Technology & Sustainability',
        'consumer': 'Consumer Applications & Services',
        'other': 'Other Technology'
    }
    return sector_map.get(sector, sector.title())

    # =============================================================================
    # HEALTH CHECK ENDPOINT
    # =============================================================================
@functions_framework.http
def health_check(request: Request):
    """Health check endpoint for Cloud Function"""
    
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        headers = get_cors_headers(include_content_type=False)
        return ('', 204, headers)
    
    # Only accept GET requests
    if request.method != 'GET':
        headers = get_cors_headers()
        return (
            json.dumps({"error": "Method not allowed. Use GET."}),
            405,
            headers
        )
    
    cors_headers = get_cors_headers()
    
    health_result = {
        "status": "healthy",
        "service": "AnalystIQ Investment Analysis",
        "processor_id": PROCESSOR_ID,
        "project": PROJECT_ID,
        "location": LOCATION,
        "version": "1.0-production",
        "timestamp": datetime.now().isoformat()
    }
    
    print("✅ Health check passed")
    return (json.dumps(health_result), 200, cors_headers)