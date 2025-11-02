"""
================================================================================
AGENT 1: EXTRACT DATA (FIXED)
================================================================================
Uses EXACT prompt from main.py analyze_investment_opportunity()
NO simplification - full extraction logic
================================================================================
"""

import json
import re
from typing import Dict, Any
from vertexai.generative_models import GenerativeModel

def agent_extract(full_text: str, file_names: list, sector: str) -> Dict[str, Any]:
    """
    AGENT 1: Extract ALL raw data from pitch deck
    Uses EXACT same prompt as main.py analyze_investment_opportunity()
    """
    
    print("\n   🔍 AGENT 1 (EXTRACT): Starting extraction...")
    print(f"   📄 Files: {file_names}")
    print(f"   🏢 Sector: {sector}")
    
    try:
        # Initialize Gemini - try multiple models
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
                model = GenerativeModel(model_name)
                model.generate_content("test", generation_config={"max_output_tokens": 2})
                model_used = model_name
                print(f"   ✅ Using {model_name}")
                break
            except Exception as e:
                print(f"   ⚠️  {model_name} unavailable")
                continue
        
        if not model:
            raise Exception("No Gemini models available")
        
        # ========================================================================
        # EXACT PROMPT FROM YOUR main.py (lines 1400-1600 approximately)
        # ========================================================================
        extraction_prompt = """You are a senior venture capital analyst with 15+ years of experience.

Your task: Extract EVERY piece of investment data from this startup pitch deck. This analysis will determine whether we invest millions of dollars, so accuracy and completeness are critical.

DOCUMENT CONTENT (first 100k chars):
{text}

================================================================================
CRITICAL EXTRACTION PRIORITIES (Extract in this order):
================================================================================
1. **TRACTION** (customers, revenue, users, growth) - HIGHEST PRIORITY
2. **FINANCIALS** (projections, burn rate, runway, unit economics)
3. **MARKET OPPORTUNITY** (TAM, SAM, SOM, growth rate)
4. **TEAM** (founders, experience, past exits, credentials)
5. **COMPETITIVE ANALYSIS** (competitors, differentiation)
6. **RISKS** (market, execution, technical, financial)

================================================================================
DATA VALIDATION RULES:
================================================================================
1. **Numbers MUST include units**: "$5M" not "5", "15%" not "15", "2,000 users" not "2000"
2. **Dates must be specific**: "Q4 2024" not "recently", "June 2025" not "soon"
3. **Sources must be precise**: "Page 12" or "Slide 7" or "Revenue Chart"
4. **Confidence levels**:
   - HIGH: Explicitly stated with numbers/dates/sources
   - MEDIUM: Implied or estimated from charts/context
   - LOW: Vague or unclear references

================================================================================
TRACTION EXTRACTION RULES (HIGHEST PRIORITY):
================================================================================
Traction is the #1 signal for investment decisions. Search EVERY page, chart, graph, caption, and footnote.

**Where to look:**
1. Dedicated "Traction" or "Growth" or "Metrics" slides
2. Charts showing revenue/user growth curves
3. Customer logo grids or testimonials
4. Press/media logos or mentions
5. Footnotes with metrics
6. About Us / Team slides (sometimes have hidden metrics)

**Acceptable extraction formats:**
✅ "250+ customers" or "customers: 250" or "250 paying clients"
✅ "$120k MRR" or "monthly revenue of $120,000" or "MRR: $120k"
✅ "15k users" or "15,000 active users" or "MAU: 15,000"
✅ "Featured in TechCrunch (May 2024)" or "TechCrunch logo shown"
✅ Customer logos: count them and name them

**Extraction examples:**
✅ GOOD: "customers": "250 paying customers including Google (logo shown), Microsoft (testimonial), Amazon"
✅ GOOD: "revenue": "$120k MRR with 15% month-over-month growth, chart shows trajectory from $50k (Jan) to $120k (June)"
✅ GOOD: "users": "15,000 monthly active users, grew from 2,000 (Q1) to 15,000 (Q2) representing 650% growth"
❌ BAD: "customers": "Not mentioned in document" (when customer logos exist)
❌ BAD: "revenue": "Not specified" (when revenue chart shows growth trend)

================================================================================
JSON OUTPUT STRUCTURE:
================================================================================
Return ONLY this JSON. Fill EVERY field. If not found after exhaustive search, use "Not mentioned in document".

{{
  "startupName": "Exact company name from document",
  "industry": "Industry/vertical (e.g., FinTech, HealthTech, SaaS)",
  "stage": "Funding stage: Pre-seed/Seed/Series A/Series B",
  
  "recommendation": {{
    "text": "INVEST or PASS or REVIEW",
    "score": 0-100 (0-40: Pass, 41-70: Review, 71-100: Invest),
    "justification": "2-3 sentence explanation of score based on traction, market, team, financials",
    "founderScore": 0-100,
    "marketScore": 0-100,
    "diffScore": 0-100,
    "teamScore": 0-100
  }},
  
  "keyMetrics": [
    {{
      "label": "Metric name (e.g., 'Monthly Recurring Revenue', 'Customer Count')",
      "value": "Value with units (e.g., '$120k MRR', '250 customers')",
      "source": {{
        "type": "document",
        "location": "Page X, Slide Y, or Chart Title",
        "confidence": "high/medium/low",
        "details": "How extracted"
      }}
    }}
  ],
  
  "traction": {{
    "customers": "Extract count, names, logos. If TRULY not found: 'Not mentioned in document'",
    "revenue": "Extract MRR/ARR. If charts only: describe. If TRULY not found: 'Not mentioned in document'",
    "users": "Extract count, growth, engagement. If TRULY not found: 'Not mentioned in document'",
    "growth_rate": "Extract % MoM, YoY. Check charts. If TRULY not found: 'Not mentioned in document'",
    "partnerships": "Extract partner names, integrations. If TRULY not found: 'Not mentioned in document'",
    "awards": "Extract awards, recognitions, competition wins. If TRULY not found: 'Not mentioned in document'",
    "media": "Extract press mentions with dates. If TRULY not found: 'Not mentioned in document'"
  }},
  
  "summaryContent": {{
    "businessOverview": "3-5 sentences: problem, solution, for whom, unique",
    "teamExperience": "3-5 sentences: founders, experience, expertise, why qualified",
    "productTech": "3-5 sentences: how it works, features, tech stack, IP, dev stage"
  }},
  
  "riskAssessment": [
    {{
      "type": "market-risk/execution-risk/financial-risk/technical-risk",
      "level": "high/medium/low",
      "title": "Risk title",
      "description": "2-3 sentences describing the risk",
      "mitigation": "How team mitigates",
      "impact": "What happens if risk materializes"
    }}
  ],
  
  "competitiveAnalysis": [
    {{
      "competitor": "Competitor name",
      "differentiators": "How different",
      "marketShare": "If mentioned",
      "strengths": "Competitor advantages",
      "weaknesses": "Where target company is better"
    }}
  ],
  
  "marketOpportunity": {{
    "TAM": "Total Addressable Market with units (e.g., '$300B global market')",
    "SAM": "Serviceable Addressable Market",
    "SOM": "Serviceable Obtainable Market",
    "growthRate": "Market CAGR or growth rate",
    "marketTrends": "Key industry trends",
    "entryBarriers": "Barriers for competitors"
  }},
  
  "financialProjections": [
    {{
      "year": "Year (2025, 2026, etc)",
      "revenue": "Projected revenue",
      "expenses": "Projected expenses if mentioned",
      "margins": "Gross/net margins if mentioned",
      "metrics": "Other metrics (e.g., 'customers: 500')",
      "source": "Where found (e.g., 'Page 15, Financial Projections')"
    }}
  ],
  
  "valuationInsights": {{
    "currentValuation": "Current/pre-money valuation",
    "post_moneyValuation": "Post-money valuation",
    "pricingPerShare": "Share price if mentioned",
    "comparableCompanies": "Comparable companies",
    "keyMetricsForValuation": "Valuation justification"
  }},
  
  "investmentTerms": {{
    "roundType": "Seed/Series A/SAFE/Convertible Note",
    "requestedAmount": "Amount raising",
    "equity": "Equity % if specified",
    "minimumInvestment": "Minimum check size",
    "useOfFunds": "How funds will be used",
    "fundingTimeline": "When funds needed"
  }},
  
  "crossDocumentInsights": [
    {{
      "type": "consistency/contradiction/opportunity/concern",
      "title": "Insight title",
      "description": "Cross-document observation",
      "confidence": "high/medium/low",
      "status": "verified/needs_clarification"
    }}
  ]
}}

================================================================================
CRITICAL REMINDERS:
================================================================================
1. **TRACTION IS #1 PRIORITY** - Check EVERY page, chart, graph for metrics
2. Include units with all numbers (%, $, count)
3. Extract from charts/graphs/visuals, not just text
4. Be specific with sources (Page X, Slide Y)
5. Only use "Not mentioned in document" after exhaustive search
6. Return ONLY valid JSON, no markdown

Begin analysis now. START JSON OUTPUT:"""
        
        text_limited = full_text[:100000]
        
        print("   📡 Calling Gemini for extraction...")
        
        response = model.generate_content(
            extraction_prompt.format(text=text_limited),
            generation_config={
                "temperature": 0.1,
                "max_output_tokens": 4000,
            }
        )
        
        response_text = response.text.strip() if hasattr(response, 'text') else str(response)
        
        print("   ✅ Response received")
        
        # Extract JSON
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if not json_match:
            print("   ❌ No JSON found")
            return {"error": "No structured data extracted"}
        
        try:
            extracted = json.loads(json_match.group(0))
        except json.JSONDecodeError as e:
            print(f"   ❌ JSON parsing failed: {str(e)}")
            return {"error": f"Failed to parse JSON: {str(e)}"}
        
        # Add metadata
        extracted['_agent_name'] = 'AGENT_1_EXTRACT'
        extracted['_status'] = 'complete'
        extracted['_model_used'] = model_used
        
        print(f"   ✅ AGENT 1 COMPLETE: {extracted.get('startupName', 'Unknown')}")
        
        return extracted
        
    except Exception as e:
        print(f"   ❌ AGENT 1 ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "_status": "failed"}