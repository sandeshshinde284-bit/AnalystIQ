"""
================================================================================
AGENT 2: MAP / ANALYZE & SCORE (FIXED)
================================================================================
Analyzes extracted data and generates scores, recommendations, and risks.
Benchmarking comparison against industry standards
Public data synthesis (GitHub, news, company info)

NOW receives full Agent 1 output and uses it properly.
================================================================================
"""

import json
import re
import requests
from typing import Dict, Any
from vertexai.generative_models import GenerativeModel
from datetime import datetime
import os
from functools import wraps

def agent_map(extracted_data: Dict[str, Any], sector: str) -> Dict[str, Any]:
    """
    AGENT 2: Analyze extracted data and generate scores
    
    Receives Agent 1 extracted data and:
    - Scores on 4 dimensions (founder, market, differentiation, team)
    - Generates recommendation (INVEST/PASS/REVIEW)
    - Identifies risks based on traction, financials, market
    - Analyzes competitive position
    
    Args:
        extracted_data: Full output from Agent 1 (ALREADY has all extracted fields)
        sector: Startup sector
    
    Returns:
        Dict with analysis, scores, recommendation, risks
    """
    
    print("\n   📊 AGENT 2 (MAP): Starting analysis...")
    print(f"   Company: {extracted_data.get('startupName', 'Unknown')}")
    
    try:
        # Initialize Gemini
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
        
        # Prepare extracted data as JSON string
        extracted_json = json.dumps(extracted_data, indent=2)
        
        # ========================================================================
        # ANALYSIS PROMPT - Analyze extracted data and generate scores
        # ========================================================================
        analysis_prompt = """You are a senior venture capital analyst with 15+ years of experience.

Your job: ANALYZE the extracted startup data and provide:
1. Scoring on 4 dimensions (founder, market, differentiation, team) - 0-100 each
2. Overall recommendation (INVEST/PASS/REVIEW) with score (0-100)
3. Risk assessment based on the data
4. Competitive analysis assessment
5. Cross-document insights

EXTRACTED DATA FROM AGENT 1:
{extracted_data}

================================================================================
SCORING DIMENSIONS:
================================================================================

**Founder Score (0-100):**
- Look at: teamExperience, past exits, relevant expertise, domain knowledge
- HIGH (80-100): Experienced founders with relevant background, multiple successful exits
- MEDIUM (50-79): Some experience, startup background, domain familiarity
- LOW (0-49): First-time founders, no relevant experience, unclear background

**Market Score (0-100):**
- Look at: TAM, SAM, SOM, growthRate, marketTrends
- HIGH (80-100): >$1B TAM, >20% market growth, clear demand signals
- MEDIUM (50-79): $100M-$1B TAM, 10-20% growth, some validation
- LOW (0-49): <$100M TAM, <10% growth, unproven market

**Differentiation Score (0-100):**
- Look at: competitive advantages, differentiators, IP, product uniqueness
- HIGH (80-100): Clear moat, unique technology, defensible advantages
- MEDIUM (50-79): Some differentiation, better approach, not fully defensible
- LOW (0-49): "Me too" product, no clear advantages, easily copied

**Team Score (0-100):**
- Look at: team size, expertise mix, execution capability, hiring ability
- HIGH (80-100): Strong team, complementary skills, execution track record
- MEDIUM (50-79): Adequate team, some skill gaps, some execution risk
- LOW (0-49): Weak team, missing expertise, execution risk

================================================================================
OVERALL RECOMMENDATION SCORING:
================================================================================
- INVEST (71-100): Strong traction, clear market, experienced team, defensible product
- REVIEW (41-70): Mixed signals, needs more investigation, could go either way
- PASS (0-40): Major red flags, weak fundamentals, significant risks

Weighting: Traction (40%), Team (30%), Market (20%), Differentiation (10%)

================================================================================
RISK ASSESSMENT:
================================================================================
Analyze from the extracted data:
- Market Risk: Is TAM real? Market adoption challenges?
- Execution Risk: Can team deliver? Hiring, timeline, complexity?
- Financial Risk: Burn rate, runway, path to profitability?
- Technical Risk: Can they build it? Tech challenges, scalability?
- Competitive Risk: Can competitors copy? How defensible?

================================================================================
OUTPUT JSON STRUCTURE:
================================================================================

{{
  "recommendation": {{
    "text": "INVEST or PASS or REVIEW",
    "score": 0-100,
    "justification": "2-3 sentences based on traction, market, team, financials. WHY this recommendation?",
    "founderScore": 0-100,
    "marketScore": 0-100,
    "diffScore": 0-100,
    "teamScore": 0-100,
    "reasoning": {{
      "founder": "Why this founder score",
      "market": "Why this market score",
      "differentiation": "Why this differentiation score",
      "team": "Why this team score"
    }}
  }},
  
  "riskAssessment": [
    {{
      "type": "market-risk OR execution-risk OR financial-risk OR technical-risk OR competitive-risk",
      "level": "high OR medium OR low",
      "title": "Risk title",
      "description": "2-3 sentences describing the risk based on extracted data",
      "mitigation": "How team could mitigate (if mentioned in data)",
      "impact": "What happens if this risk materializes"
    }}
  ],
  
  "competitiveAnalysis": [
    {{
      "competitor": "Competitor name from extracted data",
      "differentiators": "How target company claims to be different",
      "marketShare": "Competitor's market position if mentioned",
      "strengths": "Competitor strengths from extracted data",
      "weaknesses": "How target company is better / competitor weaknesses"
    }}
  ],
  
  "crossDocumentInsights": [
    {{
      "type": "consistency OR contradiction OR opportunity OR concern",
      "title": "Insight title",
      "description": "Cross-document observation or inconsistency",
      "confidence": "high OR medium OR low",
      "status": "verified OR needs_clarification"
    }}
  ],
  
  "keyMetrics": [
    {{
      "label": "Metric name for analysis",
      "value": "Value from extracted data",
      "source": {{
        "type": "document",
        "location": "From extracted data",
        "confidence": "high/medium/low based on extraction clarity",
        "details": "Assessment based on data"
      }},
      "assessment": "Why this metric matters (e.g., 'Good traction', 'Concerning burn rate')"
    }}
  ]
}}

================================================================================
ANALYSIS GUIDELINES:
================================================================================
1. Base analysis ONLY on extracted data provided
2. If data not available, note as "Not available in document"
3. Be specific about which metrics support your scores
4. Use traction data heavily (40% weight)
5. Consider team experience + hiring ability (30% weight)
6. Market TAM and growth (20% weight)
7. Differentiation and competitive moat (10% weight)
8. Identify ALL risks visible in the data
9. Return ONLY valid JSON, no markdown or explanation

Begin analysis. START JSON OUTPUT:"""
        
        print("   📡 Calling Gemini for analysis...")
        
        response = model.generate_content(
            analysis_prompt.format(extracted_data=extracted_json),
            generation_config={
                "temperature": 0.3,
                "max_output_tokens": 3000,
            }
        )
        
        response_text = response.text.strip() if hasattr(response, 'text') else str(response)
        
        print("   ✅ Response received")
        
        # Extract JSON
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if not json_match:
            print("   ❌ No JSON found")
            return {"error": "No analysis generated"}
        
        try:
            mapped = json.loads(json_match.group(0))
        except json.JSONDecodeError as e:
            print(f"   ❌ JSON parsing failed: {str(e)}")
            return {"error": f"Failed to parse analysis JSON: {str(e)}"}
        
        # Validate required fields
        if "recommendation" not in mapped:
            mapped["recommendation"] = {
                "text": "REVIEW",
                "score": 50,
                "justification": "Insufficient data for recommendation",
                "founderScore": 50,
                "marketScore": 50,
                "diffScore": 50,
                "teamScore": 50
            }
        
        if "riskAssessment" not in mapped:
            mapped["riskAssessment"] = []
        
        if "competitiveAnalysis" not in mapped:
            mapped["competitiveAnalysis"] = []
        
        if "crossDocumentInsights" not in mapped:
            mapped["crossDocumentInsights"] = []
        
        if "keyMetrics" not in mapped:
            mapped["keyMetrics"] = []
      
        
        # ====================================================================
        # STEP 2: ADD BENCHMARKING (NEW)
        # ====================================================================
        
        print(f"\n   📊 Step 2: Calculating benchmarking...")
        benchmarking = add_benchmark_comparison(mapped, sector)
        mapped['benchmarking'] = benchmarking

        # ====================================================================
        # STEP 3: ADD PUBLIC DATA (NEW)
        # ====================================================================
        
        print(f"\n   🌐 Step 3: Fetching public data...")
        startup_name = extracted_data.get('startupName', 'Unknown')
        public_data = synthesize_public_data_with_gemini(startup_name, extracted_data)
        mapped['public_data'] = public_data

        # ====================================================================
        # FINALIZE RESULTS
        # ====================================================================
        
        mapped['_agent_name'] = 'AGENT_2_MAP'
        mapped['_status'] = 'complete'
        mapped['_model_used'] = model_used
        mapped['_timestamp'] = datetime.now().isoformat()
        
        print(f"   ✅ AGENT 2 COMPLETE: {mapped.get('recommendation', {}).get('text', 'Unknown')} ({mapped.get('recommendation', {}).get('score', 'N/A')}/100)")

        return mapped
        
    except Exception as e:
        print(f"   ❌ AGENT 2 ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "_status": "failed"}

# ============================================================================
# BENCHMARKING FUNCTION (moved from main.py)
# ============================================================================

def add_benchmark_comparison(analysis: dict, sector: str) -> str:
    """Compare metrics against industry benchmarks"""
    try:
        print(f"   📊 Benchmarking: Comparing against {sector} industry standards...")
        
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
                test_model = GenerativeModel(model_name)
                test_model.generate_content("test", generation_config={"max_output_tokens": 2})
                model = test_model
                print(f"   ✓ Using {model_name}")
                break
            except Exception as e:
                print(f"   ⚠️ {model_name} unavailable")
                continue
        
        if not model:
            raise Exception("No Gemini models available")
        
        # Extract metrics from analysis
        metrics = analysis.get("keyMetrics", [])
        recommendation = analysis.get("recommendation", {})
        scores = recommendation.get("categoryScores", {})
        
        metrics_text = "\n".join([f"- {m.get('label')}: {m.get('value')}" for m in metrics[:10]])
        
        sector_context = {
            'saas': 'SaaS B2B',
            'fintech': 'Financial Technology',
            'healthtech': 'Healthcare Tech',
            'edtech': 'Education Tech',
            'ai': 'Artificial Intelligence & Machine Learning',
            'ecommerce': 'E-Commerce & Direct-to-Consumer',
            'other': 'Technology'
        }
        
        context_label = sector_context.get(sector, 'Technology')
        
        prompt = f"""Compare these startup metrics against {context_label} industry benchmarks for Seed/Series A stage:

Metrics:
{metrics_text}

Scores:
- Founder Fit: {scores.get('founder', 75)}/100
- Market: {scores.get('market', 75)}/100
- Differentiation: {scores.get('differentiation', 75)}/100
- Team: {scores.get('team', 75)}/100

For each metric, provide:
1. Industry Benchmark for {context_label}
2. Assessment: 🟢 Above Average | 🟡 Average | 🔴 Below Average
3. Implication for investment

Format as a structured comparison table with clear rankings."""

        response = model.generate_content(
            prompt,
            generation_config={"max_output_tokens": 1024, "temperature": 0.7}
        )
        
        benchmarking = response.text if hasattr(response, 'text') else str(response)
        print(f"   ✓ Benchmarking analysis generated ({len(benchmarking)} chars)")
        return benchmarking
        
    except Exception as e:
        print(f"   ⚠️ Benchmarking error: {str(e)}")
        return "Benchmarking analysis unavailable."


# ============================================================================
# PUBLIC DATA SYNTHESIS (moved from main.py)
# ============================================================================

def extract_founders_from_analysis(analysis: dict) -> list:
    """Extract founder names from analysis"""
    try:
        founders = []
        summary = analysis.get('summaryContent', {})
        team_exp = summary.get('teamExperience', '')
        
        if not team_exp:
            return []
        
        # Pattern: "Founder: Name"
        pattern1 = r'(?:Founder|CEO|Co-founder|CTO):\s*([A-Z][a-z]+\s+[A-Z][a-z]+)'
        matches1 = re.findall(pattern1, team_exp)
        founders.extend(matches1)
        
        # Pattern: "Name is the founder"
        pattern2 = r'([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:is\s+)?(?:founder|ceo|cto|engineer)'
        matches2 = re.findall(pattern2, team_exp)
        founders.extend(matches2)
        
        founders = list(set(founders))[:5]
        return founders
        
    except Exception as e:
        print(f"   ⚠️ Error extracting founders: {str(e)}")
        return []


def fetch_founder_github_profiles(founder_names: list) -> dict:
    """Fetch founder GitHub profiles - FREE API"""
    try:
        print(f"   🔗 GitHub: Fetching founder profiles...")
        
        github_profiles = []
        github_search_url = "https://api.github.com/search/users"
        
        if not founder_names or len(founder_names) == 0:
            print(f"   ⚠️ No founder names to search")
            return {'github_profiles': [], 'total_profiles': 0}
        
        for founder in founder_names:
            if not founder or len(founder.strip()) < 2:
                continue
            
            try:
                print(f"   📝 Searching: {founder}")
                
                params = {
                    'q': founder,
                    'sort': 'followers',
                    'order': 'desc',
                    'per_page': 3
                }
                
                response = requests.get(github_search_url, params=params, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data.get('total_count', 0) > 0:
                        user = data['items'][0]
                        user_detail_url = f"https://api.github.com/users/{user['login']}"
                        detail_response = requests.get(user_detail_url, timeout=10)
                        
                        if detail_response.status_code == 200:
                            details = detail_response.json()
                            
                            profile = {
                                'name': founder,
                                'github_username': user['login'],
                                'profile_url': user['html_url'],
                                'followers': user.get('followers', 0),
                                'public_repos': user.get('public_repos', 0),
                                'bio': user.get('bio', 'N/A'),
                                'company': details.get('company', 'N/A'),
                                'location': details.get('location', 'N/A'),
                                'blog': details.get('blog', 'N/A'),
                                'twitter': details.get('twitter_username', 'N/A'),
                                'public_gists': details.get('public_gists', 0),
                                'created_at': details.get('created_at', 'N/A')
                            }
                            
                            github_profiles.append(profile)
                            print(f"   ✓ Found: @{user['login']} ({user.get('followers', 0)} followers)")
                    else:
                        print(f"   ⚠️ No profile found: {founder}")
                
            except requests.exceptions.Timeout:
                print(f"   ⚠️ GitHub timeout for {founder}")
            except Exception as e:
                print(f"   ⚠️ GitHub error: {str(e)[:50]}")
        
        print(f"   ✓ GitHub: Found {len(github_profiles)} profiles")
        return {
            'github_profiles': github_profiles,
            'total_profiles': len(github_profiles),
            'confidence': 'high' if github_profiles else 'low'
        }
    
    except Exception as e:
        print(f"   ❌ GitHub fetch error: {str(e)}")
        return {'github_profiles': [], 'total_profiles': 0, 'error': str(e)}


def search_startup_comprehensively(startup_name: str, serpapi_key: str) -> dict:
    """Run comprehensive search for startup data"""
    try:
        print(f"   📰 SerpAPI: Running searches...")
        
        if not serpapi_key:
            print(f"   ⚠️ SerpAPI key not found")
            return {}
        
        search_queries = [
            f"{startup_name} funding rounds",
            f"{startup_name} founders team",
            f"{startup_name} revenue metrics",
        ]
        
        all_results = {
            'news': [],
            'company_info': {}
        }
        
        search_count = 0
        
        for query in search_queries:
            if search_count >= 3:
                break
            
            try:
                print(f"   🔍 Searching: {query}")
                
                params = {
                    'q': query,
                    'api_key': serpapi_key,
                    'engine': 'google',
                    'num': 5
                }
                
                response = requests.get(
                    "https://serpapi.com/search.json",
                    params=params,
                    timeout=15
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extract news results
                    news_results = data.get('news_results', [])
                    for news in news_results[:2]:
                        all_results['news'].append({
                            'title': news.get('title', ''),
                            'source': news.get('source', 'Google'),
                            'link': news.get('link', ''),
                            'date': news.get('date', ''),
                            'snippet': news.get('snippet', '')[:150]
                        })
                    
                    # Extract organic results
                    organic = data.get('organic_results', [])
                    for result in organic[:2]:
                        all_results['news'].append({
                            'title': result.get('title', ''),
                            'source': 'Google Search',
                            'link': result.get('link', ''),
                            'snippet': result.get('snippet', '')[:150]
                        })
                    
                    if search_count == 0 and 'knowledge_graph' in data:
                        kg = data['knowledge_graph']
                        all_results['company_info'] = {
                            'name': kg.get('title', ''),
                            'description': kg.get('description', '')[:200],
                            'website': kg.get('website', ''),
                            'type': kg.get('type', '')
                        }
                    
                    print(f"   ✓ Found {len(news_results)} news items")
                    search_count += 1
                    
                elif response.status_code == 401:
                    print(f"   ❌ SerpAPI: Unauthorized")
                    break
                else:
                    print(f"   ⚠️ SerpAPI error: {response.status_code}")
                    
            except requests.exceptions.Timeout:
                print(f"   ⚠️ SerpAPI timeout")
            except Exception as e:
                print(f"   ⚠️ SerpAPI error: {str(e)[:50]}")
        
        print(f"   ✓ SerpAPI: Found {len(all_results['news'])} news items")
        return all_results
    
    except Exception as e:
        print(f"   ❌ SerpAPI error: {str(e)}")
        return {}


def synthesize_public_data_with_gemini(startup_name: str, analysis: dict) -> dict:
    """Synthesize public data from multiple sources"""
    try:
        print(f"\n   🌐 PUBLIC DATA: Fetching comprehensive data for {startup_name}...")
        
        public_data = {
            'github_profiles': [],
            'comprehensive_news': [],
            'company_info': {},
            'source': 'real_apis'
        }
        
        # 1. GitHub Profiles (FREE)
        print(f"\n   🔗 Step 1/2: GitHub profiles...")
        try:
            founders = extract_founders_from_analysis(analysis)
            if founders:
                github_result = fetch_founder_github_profiles(founders)
                public_data['github_profiles'] = github_result.get('github_profiles', [])
            else:
                print(f"   ⚠️ No founders extracted")
        except Exception as e:
            print(f"   ⚠️ GitHub error: {str(e)[:100]}")
        
        # 2. News & Company Info (with API keys if available)
        print(f"\n   📰 Step 2/2: News & company info...")
        try:
            serpapi_key = os.getenv('SERPAPI_KEY')
            if serpapi_key:
                serp_results = search_startup_comprehensively(startup_name, serpapi_key)
                public_data['comprehensive_news'].extend(serp_results.get('news', []))
                if serp_results.get('company_info'):
                    public_data['company_info'].update(serp_results['company_info'])
            else:
                print(f"   ⚠️ SerpAPI key not found (optional)")
        except Exception as e:
            print(f"   ⚠️ News fetch error: {str(e)[:100]}")
        
        print(f"\n   ✓ PUBLIC DATA: Complete")
        print(f"     - GitHub: {len(public_data['github_profiles'])} profiles")
        print(f"     - News: {len(public_data['comprehensive_news'])} articles")
        
        return public_data
        
    except Exception as e:
        print(f"   ❌ Public data error: {str(e)}")
        return {
            'github_profiles': [],
            'comprehensive_news': [],
            'company_info': {},
            'error': str(e),
            'source': 'real_apis'
        }
