<template>
  <div class="page-wrapper">
    <div class="container">
      <div class="header">
        <p class="subtitle">View and manage your startup investment analyses</p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading your analyses...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <i class="ri-error-warning-line"></i>
        <p>{{ error }}</p>
        <button @click="loadAnalyses" class="retry-btn">Retry</button>
      </div>

      <!-- Analyses Grid -->
      <div v-else-if="analyses.length > 0" class="analyses-grid">
        <div
          v-for="analysis in analyses"
          :key="analysis.id"
          class="analysis-card"
          @click="viewAnalysis(analysis.id)"
        >
          <div class="card-header">
            <h3>{{ analysis.startupName || "Unknown Company" }}</h3>
            <span class="badge" :class="getRecommendationClass(analysis)">
              {{
                analysis.agents?.agent1?.extracted?.recommendation?.text ||
                "REVIEW"
              }}
            </span>
          </div>

          <div class="card-body">
            <p class="industry">
              {{ analysis.industry || "Technology" }}
            </p>
            <!-- <p class="date">
              {{ analysis.analysisDate }}
            </p> -->
            <div class="score">
              <span class="score-label">Score:</span>
              <span class="score-value">
                {{ analysis.recommendation?.score || 50 }}/100
              </span>
            </div>
          </div>

          <div class="card-footer">
            <button class="view-btn">
              View Analysis
              <i class="ri-arrow-right-line"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <i class="ri-inbox-line"></i>
        <h3>No Analyses Yet</h3>
        <p>Start by creating a new analysis of your first startup</p>
        <router-link to="/app/new-analysis" class="create-btn">
          Create First Analysis
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDatabaseStore } from "@/stores/databaseStore";
import { useAnalysisStore } from "@/stores/analysisStore";

const router = useRouter();
const databaseStore = useDatabaseStore();
const analysisStore = useAnalysisStore();

const analyses = ref<any[]>([]);
const isLoading = ref(true);
const error = ref("");

onMounted(async () => {
  await loadAnalyses();
});

async function loadAnalyses() {
  isLoading.value = true;
  error.value = "";

  try {
    const userAnalyses = await databaseStore.loadUserAnalyses();
    analyses.value = userAnalyses || [];

    if (analyses.value.length === 0) {
      console.log("No analyses found");
    } else {
      console.log(`Loaded ${analyses.value.length} analyses`);
    }
  } catch (err: any) {
    error.value = err.message || "Failed to load analyses";
    console.error("Error loading analyses:", err);
  } finally {
    isLoading.value = false;
  }
}

function viewAnalysis(analysisId: string) {
  try {
    const analysis = analyses.value.find((a) => a.id === analysisId);

    if (!analysis) {
      error.value = "Analysis not found";
      return;
    }

    const formattedAnalysis = {
      // ===== BASIC INFO =====
      startupName: analysis.startupName || "Unknown",
      industry: analysis.industry || "Not specified",
      sector: analysis.sector || "technology",
      stage: analysis.stage || "Not specified",
      analysisDate:
        analysis.analysisDate || analysis.updatedAt || analysis.createdAt,

      // ===== RECOMMENDATION WITH CATEGORY SCORES =====
      recommendation: {
        text: analysis.recommendation?.text || "REVIEW",
        score: analysis.recommendation?.score || 50,
        justification: analysis.recommendation?.justification || "",
        categoryScores: analysis.recommendation?.categoryScores || {
          // ✅ NESTED!
          founder: analysis.recommendation?.categoryScores?.founder || 75,
          market: analysis.recommendation?.categoryScores?.market || 75,
          differentiation:
            analysis.recommendation?.categoryScores?.differentiation || 75,
          team: analysis.recommendation?.categoryScores?.team || 75,
        },
      },

      // ===== KEY METRICS =====
      keyMetrics: analysis.keyMetrics || [],

      // ===== SUMMARY CONTENT =====
      summaryContent: {
        businessOverview:
          analysis.summaryContent?.businessOverview ||
          analysis.businessOverview ||
          "",
        teamExperience:
          analysis.summaryContent?.teamExperience ||
          analysis.teamExperience ||
          "",
        productTech:
          analysis.summaryContent?.productTech || analysis.productTech || "",
      },

      // ===== RISK ASSESSMENT =====
      riskAssessment: analysis.riskAssessment || [],

      // ===== COMPETITIVE ANALYSIS =====
      competitiveAnalysis: analysis.competitiveAnalysis || [],

      // ===== MARKET OPPORTUNITY =====
      marketOpportunity: analysis.marketOpportunity || {},

      // ===== FINANCIAL PROJECTIONS =====
      financialProjections: analysis.financialProjections || [],

      // ===== VALUATION INSIGHTS =====
      valuationInsights: analysis.valuationInsights || {},

      // ===== INVESTMENT TERMS ===== (✅ THIS WAS MISSING)
      investmentTerms: analysis.investmentTerms || {},

      // ===== TRACTION =====
      traction: analysis.traction || {
        customers: "",
        revenue: "",
        users: "",
        growth_rate: "",
        partnerships: "",
        awards: "",
        media: "",
      },

      // ===== CROSS DOCUMENT INSIGHTS =====
      crossDocumentInsights: analysis.crossDocumentInsights || [],

      // ===== CALL PREP QUESTIONS =====
      call_prep_questions: analysis.call_prep_questions || "",
      questions_json: analysis.questions_json || analysis.questions || [],

      // ===== BENCHMARKING ===== (✅ THIS WAS MISSING)
      benchmarking: analysis.benchmarking || "",

      // ===== MEMO PDF =====
      memo_pdf_base64: analysis.memo_pdf_base64 || null,

      // ===== PUBLIC DATA ===== (✅ THIS WAS MISSING)
      public_data: analysis.public_data || null,

      // ===== DOCUMENTS ANALYZED =====
      documentsAnalyzed:
        analysis.documentsAnalyzed || analysis.metadata?.fileNames || [],

      // ===== ANALYSIS METADATA =====
      analysisMetadata: {
        aiModel:
          analysis.analysisMetadata?.aiModel ||
          analysis.aiModel ||
          "gemini-2.0-flash",
        documentsProcessed:
          analysis.analysisMetadata?.documentsProcessed ||
          analysis.metadata?.fileNames?.length ||
          0,
        analysisDepth:
          analysis.analysisMetadata?.analysisDepth || "comprehensive",
        crossValidationPerformed:
          analysis.analysisMetadata?.crossValidationPerformed || false,
        processingTime:
          analysis.analysisMetadata?.processingTime || "real-time",
        processingMethod:
          analysis.analysisMetadata?.processingMethod || "online_ocr",
      },
    };

    // ✅ LOG FETCHED DATA
    console.log("=== FETCHED FROM DATABASE ===");
    console.log(JSON.stringify(formattedAnalysis, null, 2));
    console.log("=== END FETCHED ===");

    // Set in store
    analysisStore.analysisResult = formattedAnalysis;
    analysisStore.isLoading = false;

    console.log("✅ Analysis loaded:", formattedAnalysis.startupName);

    // Navigate to results
    router.push("/app/analysis-results");
  } catch (err: any) {
    error.value = "Failed to load analysis";
    console.error("Error viewing analysis:", err);
  }
}

function formatDate(dateString: any): string {
  if (!dateString) return "Unknown date";

  try {
    let date: Date;

    // ✅ Handle Firestore Timestamp object
    if (dateString && typeof dateString === "object" && dateString.toDate) {
      date = dateString.toDate();
    }
    // ✅ Handle ISO string with microseconds (from backend)
    else if (typeof dateString === "string") {
      // ✅ Remove microseconds if present
      const cleanDateString = dateString.split(".")[0]; // "2025-11-02T07:34:24"
      console.log("Original:", dateString, "Cleaned:", cleanDateString);
      date = new Date(cleanDateString);
    }
    // ✅ Handle already a Date
    else if (dateString instanceof Date) {
      date = dateString;
    }
    // ✅ Fallback
    else {
      date = new Date(dateString);
    }

    // ✅ Check if valid date
    if (isNaN(date.getTime())) {
      console.warn("Invalid date after parsing:", dateString);
      return "Unknown date";
    }

    console.log("✅ Date parsed successfully:", date);

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("Date parse error:", dateString, error);
    return "Unknown date";
  }
}

function getRecommendationClass(analysis: any): string {
  const text =
    analysis.agents?.agent1?.extracted?.recommendation?.text || "REVIEW";
  return text.toLowerCase().replace(/\s+/g, "");
}
</script>

<style lang="scss" scoped>
.page-wrapper {
  background: linear-gradient(135deg, #1a1a1a 0%, #0c0c0c 100%);
  min-height: 100vh;
  padding: 40px 20px;
  color: #ffffff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;

  h1 {
    font-size: 32px;
    font-weight: 700;
    margin: 0;
  }

  .subtitle {
    color: rgba(255, 255, 255, 0.6);
    margin: 8px 0 0 0;
  }

  .new-analysis-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #00d4ff, #0099ff);
    border: none;
    border-radius: 8px;
    color: white;
    text-decoration: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 212, 255, 0.3);
    }
  }
}

.analyses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.analysis-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &:hover {
    background: rgba(0, 212, 255, 0.08);
    border-color: rgba(0, 212, 255, 0.4);
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 212, 255, 0.2);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
    flex: 1;
  }

  .badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;

    &.invest,
    &.stronginvest {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
    }

    &.pass,
    &.weak,
    &.donotinvest {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    &.review,
    &.neutral {
      background: rgba(234, 179, 8, 0.2);
      color: #eab308;
    }
  }
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .industry {
    margin: 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
  }

  .date {
    margin: 0;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
  }

  .score {
    display: flex;
    gap: 8px;
    align-items: center;

    .score-label {
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
    }

    .score-value {
      color: #00d4ff;
      font-weight: 700;
      font-size: 16px;
    }
  }
}

.card-footer {
  margin-top: 8px;
}

.view-btn {
  width: 100%;
  padding: 10px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 6px;
  color: #00d4ff;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.2);
    border-color: rgba(0, 212, 255, 0.5);
  }
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.6);
}

.loading-state {
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0, 212, 255, 0.2);
    border-top-color: #00d4ff;
    border-radius: 50%;
    margin: 0 auto 20px;
    animation: spin 1s linear infinite;
  }

  p {
    margin: 0;
    font-size: 16px;
  }
}

.empty-state {
  i {
    font-size: 48px;
    color: rgba(0, 212, 255, 0.3);
    margin-bottom: 16px;
    display: block;
  }

  h3 {
    margin: 16px 0 8px;
    color: #ffffff;
    font-size: 20px;
  }

  p {
    margin: 0 0 24px;
    color: rgba(255, 255, 255, 0.6);
  }

  .create-btn {
    display: inline-block;
    padding: 10px 24px;
    background: linear-gradient(135deg, #00d4ff, #0099ff);
    border: none;
    border-radius: 8px;
    color: white;
    text-decoration: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 212, 255, 0.3);
    }
  }
}

.error-state {
  text-align: center;
  padding: 60px 20px;
  color: #ef4444;

  i {
    font-size: 48px;
    margin-bottom: 16px;
    display: block;
  }

  p {
    margin: 0 0 24px;
    font-size: 16px;
  }

  .retry-btn {
    padding: 10px 24px;
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid #ef4444;
    border-radius: 6px;
    color: #ef4444;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(239, 68, 68, 0.3);
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;

    .new-analysis-btn {
      width: 100%;
      justify-content: center;
    }
  }

  .analyses-grid {
    grid-template-columns: 1fr;
  }
}
</style>
