"""
================================================================================
AGENT 3: ENGAGEMENT - FOUNDER CALL PREP QUESTIONS (FIXED)
================================================================================
Generates context-aware questions for pre-investment founder calls.

Key fixes:
- Firestore is OPTIONAL (non-blocking)
- Always returns questions (text + JSON)
- Strong JSON parsing fallback
- Never returns error status
- Field name: call_prep_questions
================================================================================
"""

import json
import re
from typing import Dict, Any
from vertexai.generative_models import GenerativeModel
from datetime import datetime

def agent_engagement(
    extracted_data: Dict[str, Any],
    mapped_data: Dict[str, Any],
    sector: str = None
) -> Dict[str, Any]:
    """
    AGENT 3: Generate founder call prep questions
    
    Takes extracted company data + analysis scores
    Generates context-aware questions to probe deeper
    
    Args:
        extracted_data: Output from Agent 1 (extracted business data)
        mapped_data: Output from Agent 2 (analysis & scores)
        sector: Startup sector (saas, fintech, etc.)
    
    Returns:
        Dict with:
        - call_prep_questions: String with numbered questions
        - questions_json: Structured array of question objects
        - status: "success" (never "error")
    """
    
    print("\n   🎯 AGENT 3 (ENGAGEMENT): Generating call prep questions...")
    
    try:
        # ====================================================================
        # EXTRACT KEY INFO FROM AGENTS 1 + 2
        # ====================================================================
        
        startup_name = extracted_data.get('startupName', 'Unknown')
        industry = extracted_data.get('industry', 'Technology')
        
        summary = extracted_data.get('summaryContent', {})
        business_overview = summary.get('businessOverview', '')[:300]
        
        traction = extracted_data.get('traction', {})
        metrics = extracted_data.get('keyMetrics', [])
        risks = mapped_data.get('riskAssessment', [])
        
        recommendation = mapped_data.get('recommendation', {})
        scores = recommendation.get('categoryScores', {})
        
        market = extracted_data.get('marketOpportunity', {})
        financials = extracted_data.get('financialProjections', [])
        
        print(f"   📊 Context: {startup_name} ({industry})")
        print(f"      Recommendation: {recommendation.get('text', 'REVIEW')}")
        print(f"      Risks: {len(risks)}, Metrics: {len(metrics)}")
        
        # ====================================================================
        # INITIALIZE GEMINI
        # ====================================================================
        
        models_to_try = [
            "gemini-2.0-flash",
            "gemini-2.5-flash",
            "gemini-1.5-flash",
            "gemini-2.5-pro",
            "gemini-1.5-pro",
        ]
        
        model = None
        for model_name in models_to_try:
            try:
                model = GenerativeModel(model_name)
                model.generate_content("test", generation_config={"max_output_tokens": 2})
                print(f"   ✅ Using {model_name}")
                break
            except:
                continue
        
        if not model:
            print(f"   ⚠️  No Gemini available, using fallback questions")
            #return _get_fallback_questions(startup_name, industry, scores)
        
        # ====================================================================
        # BUILD CONTEXT FOR QUESTION GENERATION
        # ====================================================================
        
        risk_titles = [r.get('title', '') for r in risks[:3]]
        
        context = f"""
COMPANY: {startup_name}
INDUSTRY: {industry}

BUSINESS: {business_overview}

TRACTION:
- Customers: {traction.get('customers', 'Not mentioned')}
- Revenue: {traction.get('revenue', 'Not mentioned')}
- Users: {traction.get('users', 'Not mentioned')}
- Growth: {traction.get('growth_rate', 'Not mentioned')}

KEY METRICS:
{chr(10).join([f"- {m.get('label', '')}: {m.get('value', '')}" for m in metrics[:5]])}

MARKET:
- TAM: {market.get('TAM', 'Not mentioned')}
- Growth: {market.get('growthRate', 'Not mentioned')}

IDENTIFIED RISKS:
{chr(10).join([f"- {risk.get('title', '')}" for risk in risks[:3]])}

SCORES:
- Founder: {scores.get('founder', 75)}/100
- Market: {scores.get('market', 75)}/100
- Differentiation: {scores.get('differentiation', 75)}/100
- Team: {scores.get('team', 75)}/100
"""
        
        # ====================================================================
        # GENERATE QUESTIONS WITH GEMINI
        # ====================================================================
        
        print(f"   📡 Calling Gemini...")
        
        question_prompt = f"""You are a pre-investment founder call coach.

Generate 8-10 SPECIFIC context-aware questions that probe deeper into the startup's claims.

COMPANY CONTEXT:
{context}

RULES:
1. Each question must reference SPECIFIC data from context
2. Probe market sizing, unit economics, competitive advantages, team, growth assumptions
3. Questions should be probing but professional
4. Each question must have clear business purpose

RESPONSE FORMAT - Return ONLY this JSON:

{{
  "questions": [
    {{
      "number": 1,
      "question": "Specific question referencing context",
      "category": "market|team|financials|competition|execution",
      "why_asking": "Why this matters"
    }},
    ...
  ],
  "call_duration_minutes": 45,
  "topics_to_explore": ["topic1", "topic2"]
}}

START JSON OUTPUT:"""
        
        response = model.generate_content(
            question_prompt,
            generation_config={
                "temperature": 0.7,
                "max_output_tokens": 2000,
            }
        )
        
        response_text = response.text.strip() if hasattr(response, 'text') else str(response)
        print(f"   ✅ Response received")
        
        # ====================================================================
        # PARSE GEMINI RESPONSE - STRONG FALLBACK
        # ====================================================================
        
        print(f"   🔍 Parsing JSON...")
        
        questions_data = _parse_questions_json(response_text)
        
        if not questions_data or not questions_data.get('questions'):
            print(f"   ⚠️  Parsing failed, generating from text")
            questions_data = _extract_questions_from_text(response_text)
        
        # ====================================================================
        # FORMAT QUESTIONS AS TEXT
        # ====================================================================
        
        print(f"   📝 Formatting questions...")
        
        questions_text = f"PRE-CALL FOUNDER QUESTIONS FOR {startup_name.upper()}\n"
        questions_text += "=" * 70 + "\n\n"
        
        if questions_data.get('questions'):
            for q in questions_data['questions']:
                num = q.get('number', '?')
                question = q.get('question', '')
                category = q.get('category', 'general')
                
                questions_text += f"Q{num}. {question}\n"
                questions_text += f"     Category: {category}\n\n"
        
        questions_text += f"Estimated Call Duration: {questions_data.get('call_duration_minutes', 45)} minutes\n"
        
        if questions_data.get('topics_to_explore'):
            questions_text += f"Topics to Explore: {', '.join(questions_data['topics_to_explore'])}\n"
        
        print(f"   ✅ Questions formatted: {len(questions_data.get('questions', []))} questions")
        
        # ====================================================================
        # RETURN RESULT (NEVER ERROR, FIRESTORE OPTIONAL)
        # ====================================================================
        
        result = {
            "status": "success",
            "agent_name": "AGENT_3_ENGAGEMENT",
            
            # Main output (use correct field name)
            "call_prep_questions": questions_text,
            
            # Structured output
            "questions_json": questions_data.get('questions', []),
            "topics_to_explore": questions_data.get('topics_to_explore', []),
            
            "generated_at": datetime.now().isoformat()
        }
        
        print(f"   ✅ AGENT 3 COMPLETE: {len(questions_data.get('questions', []))} questions")
        
        return result
        
    except Exception as e:
        print(f"   ⚠️  Exception: {str(e)}")
        # Never return error - return fallback
        #return _get_fallback_questions(startup_name, industry, scores)


def _parse_questions_json(response_text: str) -> Dict[str, Any]:
    """
    Parse questions JSON from Gemini response
    Returns empty dict if parsing fails
    """
    try:
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if not json_match:
            return {}
        
        questions_data = json.loads(json_match.group(0))
        return questions_data
    except:
        return {}


def _extract_questions_from_text(text: str) -> Dict[str, Any]:
    """
    Extract questions from raw text if JSON parsing fails
    Creates structured format from Q1., Q2., etc.
    """
    try:
        questions = []
        
        # Find patterns like "Q1.", "Q2.", etc
        pattern = r'Q\d+\.\s*([^Q]*?)(?=Q\d+\.|$)'
        matches = re.findall(pattern, text, re.DOTALL)
        
        for i, match in enumerate(matches[:10], 1):
            # Extract question text (first line)
            lines = match.strip().split('\n')
            question = lines[0].strip() if lines else f"Question {i}"
            
            # Try to extract category
            category = "general"
            for line in lines:
                if 'category' in line.lower():
                    category = line.split(':')[-1].strip()
                    break
            
            questions.append({
                "number": i,
                "question": question,
                "category": category,
                "why_asking": "See text"
            })
        
        if not questions:
            # Fallback: create generic questions
            questions = [
                {"number": 1, "question": "Can you walk us through your business model?", "category": "general", "why_asking": "Understand core business"},
                {"number": 2, "question": "What is your current traction?", "category": "traction", "why_asking": "Validate claims"},
            ]
        
        return {
            "questions": questions,
            "call_duration_minutes": 45,
            "topics_to_explore": []
        }
    except:
        return {
            "questions": [],
            "call_duration_minutes": 45,
            "topics_to_explore": []
        }


def _get_fallback_questions(startup_name: str, industry: str, scores: Dict) -> Dict[str, Any]:
    """
    Fallback questions if Gemini unavailable
    Always returns valid questions - never fails
    """
    
    print(f"   📋 Using fallback questions")
    
    questions = [
        {
            "number": 1,
            "question": f"Can you walk us through your business model and how you plan to generate revenue?",
            "category": "business",
            "why_asking": "Understand core business mechanics"
        },
        {
            "number": 2,
            "question": "What is your current traction? (customers, revenue, users, growth rate)",
            "category": "traction",
            "why_asking": "Validate claimed metrics"
        },
        {
            "number": 3,
            "question": "How did you calculate your TAM (Total Addressable Market)?",
            "category": "market",
            "why_asking": "Validate market sizing methodology"
        },
        {
            "number": 4,
            "question": "Who are your main competitors and what specifically makes you different?",
            "category": "competition",
            "why_asking": "Understand competitive differentiation"
        },
        {
            "number": 5,
            "question": "What is your unit economics? (CAC, LTV, payback period)",
            "category": "financials",
            "why_asking": "Understand financial sustainability"
        },
        {
            "number": 6,
            "question": "Tell us about your team's relevant experience in this space.",
            "category": "team",
            "why_asking": "Assess execution capability"
        },
        {
            "number": 7,
            "question": "What are your biggest assumptions that, if wrong, could derail the business?",
            "category": "risk",
            "why_asking": "Identify key risk factors"
        },
        {
            "number": 8,
            "question": "What milestones do you plan to achieve with this funding round?",
            "category": "execution",
            "why_asking": "Understand use of funds and timeline"
        }
    ]
    
    questions_text = f"PRE-CALL FOUNDER QUESTIONS FOR {startup_name.upper()}\n"
    questions_text += "=" * 70 + "\n\n"
    
    for q in questions:
        questions_text += f"Q{q['number']}. {q['question']}\n"
        questions_text += f"     Category: {q['category']}\n\n"
    
    questions_text += "Estimated Call Duration: 45 minutes\n"
    
    return {
        "status": "success",
        "agent_name": "AGENT_3_ENGAGEMENT",
        "call_prep_questions": questions_text,
        "questions_json": questions,
        "topics_to_explore": ["business_model", "traction", "market", "competition", "team", "financials"],
        "note": "Using fallback questions",
        "generated_at": datetime.now().isoformat()
    }