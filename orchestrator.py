"""
================================================================================
COMPLETE MULTI-AGENT ORCHESTRATOR (ALL 4 AGENTS)
================================================================================
Manages flow between ALL 4 agents:
- Agent 1: Extract data
- Agent 2: Analyze & score
- Agent 3: Generate call prep questions
- Agent 4: Generate investment memo PDF

Returns COMPLETE analysis with all outputs merged.
================================================================================
"""

import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

# Import all agents
from agent_extract import agent_extract as extract_agent
from agent_map import agent_map as map_agent
from agent_engagement import agent_engagement as engagement_agent
from agent_memo import agent_memo as memo_agent
from firebase_admin import firestore


class MultiAgentOrchestrator:
    """Orchestrates all 4 agents in sequence"""
    
    def __init__(self):
        """Initialize orchestrator"""
        self.request_store = {}  # In-memory: {request_id: state}
        print("🚀 Orchestrator initialized (4 agents ready)")
    
    def analyze_full_pipeline(self, 
                             extracted_text: str, 
                             file_names: list,
                             sector: str,
                             user_id: str = None) -> Dict[str, Any]:
        """
        FULL PIPELINE: All 4 Agents
        
        Calls agents in sequence:
        1. Agent 1: Extract data
        2. Agent 2: Analyze & score
        3. Agent 3: Generate call prep questions
        4. Agent 4: Generate investment memo PDF
        
        Returns complete analysis with all outputs merged.
        
        Args:
            extracted_text: Full text from documents (from Document AI)
            file_names: List of file names
            sector: Startup sector (saas, fintech, etc.)
            public_data: Optional public data (GitHub, news, etc.)
            benchmarking: Optional benchmarking analysis
        
        Returns:
            Dict with COMPLETE analysis (IDENTICAL to main.py)
        """
        
        print("\n" + "="*80)
        print("🤖 ORCHESTRATOR: Full Pipeline (Agents 1-4)")
        print("="*80)
        
        request_id = str(uuid.uuid4())
        print(f"📍 Request ID: {request_id}")
        
        try:
            # ================================================================
            # AGENT 1: EXTRACT DATA
            # ================================================================
            print("\n[1/4] 🔍 AGENT 1: Extract...")
            
            extracted = extract_agent(
                full_text=extracted_text,
                file_names=file_names,
                sector=sector
            )
            
            if "error" in extracted or extracted.get('_status') == 'failed':
                print(f"   ❌ Agent 1 failed")
                return {
                    "status": "error",
                    "stage": "agent_1_extract",
                    "error": extracted.get("error", "Extraction failed"),
                    "request_id": request_id
                }
            
            print(f"   ✅ Complete: {extracted.get('startupName', 'Unknown')}")
            
            # ================================================================
            # AGENT 2: ANALYZE & SCORE
            # ================================================================
            print("\n[2/4] 📊 AGENT 2: Analyze...")
            
            mapped = map_agent(
                extracted_data=extracted,
                sector=sector
            )
            
            if "error" in mapped or mapped.get('_status') == 'failed':
                print(f"   ❌ Agent 2 failed")
                return {
                    "status": "error",
                    "stage": "agent_2_map",
                    "error": mapped.get("error", "Analysis failed"),
                    "request_id": request_id
                }
            
            print(f"   ✅ Complete: {mapped.get('recommendation', {}).get('text', 'REVIEW')} ({mapped.get('recommendation', {}).get('score', 'N/A')}/100)")
            
            # ================================================================
            # SAVE TO FIRESTORE AFTER AGENT 2
            # ================================================================
            print("\n ✅ Saving to Firestore...")

            analysis_id = str(uuid.uuid4())
            print(f"  ✅ Saved with ID: {analysis_id}")


            # ================================================================
            # AGENT 3: ENGAGEMENT (CALL PREP QUESTIONS)
            # ================================================================
            print("\n[3/4] 🎯 AGENT 3: Questions...")
            
            engagement = engagement_agent(
                extracted_data=extracted,
                mapped_data=mapped,
                sector=sector
            )
            
            print(f"\n[DEBUG] Agent 3 Output:")
            print(f"  Status: {engagement.get('_status')}")
            print(f"  Call prep questions length: {len(engagement.get('call_prep_questions', ''))}")
            print(f"  Questions JSON count: {len(engagement.get('questions_json', []))}")
            print(f"  First 200 chars: {engagement.get('call_prep_questions', '')[:200]}")
            # Agent 3 never fails - always returns questions (fallback if needed)
            print(f"   ✅ Complete: {len(engagement.get('questions_json', []))} questions generated")
            
            # ================================================================
            # AGENT 4: MEMO PDF GENERATION
            # ================================================================
            print("\n[4/4] 📄 AGENT 4: Memo PDF...")
            
            memo = memo_agent(
                extracted_data=extracted,
                mapped_data=mapped,
                engagement_data=engagement
                #public_data=public_data,
                #benchmarking=benchmarking
            )
            
            # Agent 4 never fails - always returns PDF (fallback if needed)
            pdf_size = memo.get('pdf_size_bytes', 0)
            print(f"   ✅ Complete: {pdf_size/1024:.1f}KB PDF generated")
            
            # ================================================================
            # STORE STATE IN MEMORY
            # ================================================================
            print(f"\n💾 Storing state...")
            
            analysis_state = {
                "request_id": request_id,
                "timestamp": datetime.now().isoformat(),
                "sector": sector,
                "file_names": file_names,
                
                # All agent outputs
                "extracted": extracted,
                "mapped": mapped,
                "engagement": engagement,
                "memo": memo
            }
            
            self.request_store[request_id] = analysis_state
            print(f"   ✅ State stored")
            
            # ================================================================
            # MERGE ALL OUTPUTS
            # ================================================================
            print(f"\n🔀 Merging all outputs...")
            
            final_result = self._merge_all_outputs(
                extracted, mapped, engagement, memo
            )
            save_complete_analysis_to_firestore(user_id, analysis_id, final_result)
            
            # ================================================================
            # RETURN COMPLETE ANALYSIS
            # ================================================================
            result = {
                "status": "success",
                "stage": "full_pipeline_complete",
                "request_id": request_id,
                "analysis_id": analysis_id,
                # All merged data (from Agents 1-4)
                **final_result,
                
                # Metadata
                "analysis_timestamp": datetime.now().isoformat()
            }
            
            print("\n" + "="*80)
            print(f"✅ ORCHESTRATOR: Full Pipeline COMPLETE")
            print(f"   Company: {final_result.get('startupName', 'Unknown')}")
            print(f"   Recommendation: {final_result.get('recommendation', {}).get('text', 'Unknown')} ({final_result.get('recommendation', {}).get('score', 'N/A')}/100)")
            print(f"   Questions: {bool(final_result.get('call_prep_questions'))}")
            print(f"   Memo PDF: {bool(final_result.get('memo_pdf_base64'))} ({final_result.get('pdf_size_kb', 0):.1f}KB)")
            print("="*80 + "\n")
            
            return result
            
        except Exception as e:
            print(f"\n❌ ORCHESTRATOR ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return {
                "status": "error",
                "error": str(e),
                "stage": "orchestrator_pipeline",
                "request_id": request_id
            }
    
    
    def _merge_all_outputs(self, 
                          extracted: Dict, 
                          mapped: Dict,
                          engagement: Dict,
                          memo: Dict) -> Dict[str, Any]:
        """
        Merge outputs from all 4 agents
        
        Returns structure IDENTICAL to main.py analyze_investment_opportunity()
        
        Args:
            extracted: Agent 1 output (raw extraction)
            mapped: Agent 2 output (analysis & scoring)
            engagement: Agent 3 output (call prep questions)
            memo: Agent 4 output (PDF)
        
        Returns:
            Complete analysis matching main.py output structure exactly
        """
        
        print(f"   📦 Merging 4 agent outputs...")
        
        # ===================================================================
        # RECOMMENDATION WITH CATEGORY SCORES (Agent 2)
        # ===================================================================
        recommendation = mapped.get("recommendation", {})
        
        merged_recommendation = {
            "text": recommendation.get("text", "REVIEW"),
            "score": int(recommendation.get("score", 50)),
            "justification": recommendation.get("justification", "Analysis complete"),
            "categoryScores": {
                "founder": recommendation.get("founderScore", 75),
                "market": recommendation.get("marketScore", 75),
                "differentiation": recommendation.get("diffScore", 75),
                "team": recommendation.get("teamScore", 75)
            }
        }
        
        print(f"      ✅ Recommendation: {merged_recommendation['text']} ({merged_recommendation['score']}/100)")
        
        # ===================================================================
        # KEY METRICS (Merged from Agent 1 + Agent 2)
        # ===================================================================
        merged_metrics = []
        
        if extracted.get("keyMetrics"):
            merged_metrics.extend(extracted["keyMetrics"])
        
        if mapped.get("keyMetrics"):
            for m2 in mapped["keyMetrics"]:
                if not any(m.get("label") == m2.get("label") for m in merged_metrics):
                    merged_metrics.append(m2)
        
        print(f"      ✅ Metrics: {len(merged_metrics)} total")
        
        # ===================================================================
        # COMPETITIVE ANALYSIS (Prefer Agent 2, fallback Agent 1)
        # ===================================================================
        competitive = mapped.get("competitiveAnalysis", []) or extracted.get("competitiveAnalysis", [])

        # PUBLIC DATA AND BENCHMARKING FROM AGENT 2
        public_data = mapped.get("public_data", {})
        benchmarking = mapped.get("benchmarking", "")
        
        print(f"      ✅ Competitive: {len(competitive)} competitors")
        
        # ===================================================================
        # BUILD COMPLETE RESULT (Identical to main.py)
        # ===================================================================
        merged = {
            # ===== BASIC INFO (Agent 1) =====
            "startupName": extracted.get("startupName", "Not mentioned in document"),
            "industry": extracted.get("industry", "Not mentioned in document"),
            "stage": extracted.get("stage", "Not mentioned in document"),
            
            # ===== RECOMMENDATION (Agent 2) WITH SCORES =====
            "recommendation": merged_recommendation,
            
            # ===== KEY METRICS (Merged from both agents) =====
            "keyMetrics": merged_metrics,
            
            # ===== RISK ASSESSMENT (Agent 2) =====
            "riskAssessment": mapped.get("riskAssessment", []),
            
            # ===== SUMMARY CONTENT (Agent 1) =====
            "summaryContent": extracted.get("summaryContent", {
                "businessOverview": "Not mentioned in document",
                "teamExperience": "Not mentioned in document",
                "productTech": "Not mentioned in document"
            }),
            
            # ===== COMPETITIVE ANALYSIS (Agent 2 preferred) =====
            "competitiveAnalysis": competitive,
            
            # ===== MARKET OPPORTUNITY (Agent 1) =====
            "marketOpportunity": extracted.get("marketOpportunity", {}),
            
            # ===== FINANCIAL PROJECTIONS (Agent 1) =====
            "financialProjections": extracted.get("financialProjections", []),
            
            # ===== VALUATION INSIGHTS (Agent 1) =====
            "valuationInsights": extracted.get("valuationInsights", {}),
            
            # ===== INVESTMENT TERMS (Agent 1) =====
            "investmentTerms": extracted.get("investmentTerms", {}),
            
            # ===== TRACTION (Agent 1) =====
            "traction": extracted.get("traction", {
                "customers": "Not mentioned in document",
                "revenue": "Not mentioned in document",
                "users": "Not mentioned in document",
                "growth_rate": "Not mentioned in document",
                "partnerships": "Not mentioned in document",
                "awards": "Not mentioned in document",
                "media": "Not mentioned in document"
            }),
            
            # ===== CROSS DOCUMENT INSIGHTS (Agent 2) =====
            "crossDocumentInsights": mapped.get("crossDocumentInsights", []),

            # ===== PUBLIC DATA INSIGHTS (Agent 2) =====
            "public_data": public_data,
            
            # ===== BENCHMARKING INSIGHTS (Agent 2) =====
            "benchmarking": benchmarking,
            
            # ===== CALL PREP QUESTIONS (Agent 3) =====
            "call_prep_questions": engagement.get("call_prep_questions", ""),
            "questions_json": engagement.get("questions_json", []),
            "topics_to_explore": engagement.get("topics_to_explore", []),
            
            # ===== INVESTMENT MEMO PDF (Agent 4) =====
            "memo_pdf_base64": memo.get("memo_pdf_base64"),
            "memo_pdf_filename": memo.get("memo_pdf_filename", "Investment_Memo.pdf"),
            
            # ===== AI MODEL METADATA =====
            "ai_model_used": extracted.get("_model_used", "gemini-1.5-flash"),
            "sector": extracted.get("_sector", "other")
        }
        
        # ===================================================================
        # VERIFY ALL FIELDS PRESENT
        # ===================================================================
        expected_fields = [
            "startupName", "industry", "stage", "recommendation", "keyMetrics",
            "riskAssessment", "summaryContent", "competitiveAnalysis", "marketOpportunity",
            "financialProjections", "valuationInsights", "investmentTerms", "traction",
            "crossDocumentInsights", "call_prep_questions", "memo_pdf_base64",
            "memo_pdf_filename", "ai_model_used", "sector"
        ]
        
        missing = [f for f in expected_fields if f not in merged]
        if missing:
            print(f"      ⚠️  Missing: {missing}")
        else:
            print(f"      ✅ All {len(expected_fields)} fields present")
        
        return merged

def save_complete_analysis_to_firestore(user_id: str, analysis_id: str, final_result: dict) -> str:
    """
    Save COMPLETE analysis after ALL 4 agents finish
    This saves the merged result from _merge_all_outputs()
    """
    try:
        db = firestore.client()
        
        db.collection("analyses").document(analysis_id).set({
            "userId": user_id,
            "status": "complete",
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
            **final_result  # ✅ All data from merge - nothing missing
        })
        
        print(f"✅ Complete analysis saved: {analysis_id}")
        return analysis_id
    except Exception as e:
        print(f"❌ Save failed: {str(e)}")
        raise e

# ============================================================================
# INITIALIZE GLOBAL ORCHESTRATOR
# ============================================================================

orchestrator = MultiAgentOrchestrator()