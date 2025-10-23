<!-- AnalysisResultsView.vue -->

<template>
  <div v-if="analysisData" id="analysis-results-container" class="page-wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-main">
          <h1>Investment Analysis: {{ analysisData.startupName }}</h1>
          <div class="sector-info">
            <span v-if="analysisData.sector" class="sector-badge">
              <i class="ri-briefcase-line"></i>
              {{ getSectorLabel(analysisData.sector) }}
            </span>
            <span v-if="analysisData.industry" class="industry-badge">
              <i class="ri-building-line"></i>
              {{ analysisData.industry }}
            </span>
          </div>
          <div class="analysis-badges">
            <div
              class="analysis-badge confidence"
              :class="getConfidenceClass()"
            >
              <i class="ri-shield-check-line"></i>
              {{ getConfidenceLevel() }} Investment Confidence
            </div>
          </div>
        </div>
        <button class="export-btn primary" @click="handlePrintReport">
          <i class="ri-download-line"></i>
          📄 Print & Download as PDF
        </button>
      </div>
      <ValidationSummary v-if="showValidationSummary" />
      <!-- Recommendation Box -->
      <div class="recommendation-box">
        <div class="recommendation-header">
          <span class="label">INVESTMENT RECOMMENDATION</span>
          <span class="badge complete">Analysis Complete</span>
        </div>
        <h2 class="recommendation-text">
          {{ analysisData.recommendation.text }}
        </h2>
        <div class="recommendation-score">
          <span class="score-label">Investment Score:</span>
          <div class="score-bar">
            <div
              class="score-fill"
              :style="{ width: analysisData.recommendation.score + '%' }"
            ></div>
          </div>
          <span class="score-value"
            >{{ analysisData.recommendation.score }}/100</span
          >
        </div>
        <p class="recommendation-justification">
          {{ analysisData.recommendation.justification }}
        </p>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-navigation">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <i :class="tab.icon"></i>
          {{ tab.name }}
          <span
            v-if="tab.id === 'risk' && analysisData.riskAssessment"
            class="tab-count"
          >
            {{ analysisData.riskAssessment.length }}
          </span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- EXECUTIVE SUMMARY TAB -->
        <div data-tab-pane v-show="activeTab === 'summary'" class="tab-pane">
          <div class="summary-section">
            <h3>Business Overview</h3>
            <p>{{ analysisData.summaryContent.businessOverview }}</p>
          </div>

          <div class="summary-section">
            <h3>Team & Experience</h3>
            <p>{{ analysisData.summaryContent.teamExperience }}</p>
          </div>

          <div class="summary-section">
            <h3>Product & Technology</h3>
            <p>{{ analysisData.summaryContent.productTech }}</p>
          </div>

          <!-- Key Metrics with Context -->
          <div class="metrics-section">
            <h3>Key Investment Metrics</h3>
            <div class="metrics-grid">
              <div
                v-for="(metric, index) in analysisData.keyMetrics"
                :key="index"
                class="metric-card"
              >
                <div class="metric-header">
                  <h4>{{ metric.label }}</h4>
                  <span
                    class="confidence-badge"
                    :class="metric.source.confidence"
                  >
                    {{ metric.source.confidence }}
                  </span>
                </div>
                <div class="metric-value">{{ metric.value }}</div>
                <div class="metric-context">
                  {{ getMetricContext(metric.label) }}
                </div>
                <button class="verify-btn" @click="openSourceModal(metric)">
                  <i class="ri-search-line"></i>
                  Verify Source
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- INVESTMENT RISKS TAB -->
        <div data-tab-pane v-show="activeTab === 'risk'" class="tab-pane">
          <h3>Risk Assessment</h3>
          <div
            v-if="
              analysisData.riskAssessment &&
              analysisData.riskAssessment.length > 0
            "
            class="risks-grid"
          >
            <div
              v-for="(risk, index) in analysisData.riskAssessment"
              :key="index"
              class="risk-card"
              :class="`risk-${risk.level}`"
            >
              <div class="risk-header">
                <span class="risk-type">{{ formatRiskType(risk.type) }}</span>
                <span class="risk-level" :class="risk.level">{{
                  risk.level.toUpperCase()
                }}</span>
              </div>
              <h4>{{ risk.title }}</h4>
              <p class="risk-description">{{ risk.description }}</p>
              <div class="risk-details">
                <div class="detail-item">
                  <strong>Mitigation:</strong>
                  <p>{{ risk.mitigation }}</p>
                </div>
                <div class="detail-item">
                  <strong>Impact:</strong>
                  <p>{{ risk.impact }}</p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>No risk assessment data available</p>
          </div>
        </div>

        <!-- MARKET ANALYSIS TAB -->
        <div data-tab-pane v-show="activeTab === 'market'" class="tab-pane">
          <h3>Market Analysis</h3>

          <!-- Market Sizing -->
          <div v-if="analysisData.marketOpportunity" class="market-sizing">
            <h4>Market Sizing</h4>
            <div class="sizing-grid">
              <div class="sizing-card">
                <div class="sizing-label">TAM</div>
                <div class="sizing-value">
                  {{ analysisData.marketOpportunity.TAM || "Not specified" }}
                </div>
                <div class="sizing-desc">Total Addressable Market</div>
              </div>
              <div class="sizing-card">
                <div class="sizing-label">SAM</div>
                <div class="sizing-value">
                  {{ analysisData.marketOpportunity.SAM || "Not specified" }}
                </div>
                <div class="sizing-desc">Serviceable Addressable Market</div>
              </div>
              <div class="sizing-card">
                <div class="sizing-label">SOM</div>
                <div class="sizing-value">
                  {{ analysisData.marketOpportunity.SOM || "Not specified" }}
                </div>
                <div class="sizing-desc">Serviceable Obtainable Market</div>
              </div>
              <div class="sizing-card">
                <div class="sizing-label">Growth Rate</div>
                <div class="sizing-value">
                  {{
                    analysisData.marketOpportunity.growthRate || "Not specified"
                  }}
                </div>
                <div class="sizing-desc">CAGR / Market Growth</div>
              </div>
            </div>
          </div>

          <!-- Competitive Analysis -->
          <div
            v-if="
              analysisData.competitiveAnalysis &&
              analysisData.competitiveAnalysis.length > 0
            "
            class="competitive-section"
          >
            <h4>Competitive Landscape</h4>
            <div class="competitors-grid">
              <div
                v-for="(comp, index) in analysisData.competitiveAnalysis"
                :key="index"
                class="competitor-card"
              >
                <h5>{{ comp.competitor }}</h5>
                <div class="comp-detail">
                  <strong>Differentiators:</strong>
                  <p>{{ comp.differentiators }}</p>
                </div>
                <div class="comp-detail">
                  <strong>Market Position:</strong>
                  <p>{{ comp.marketShare || "Not specified" }}</p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>No competitive analysis data available</p>
          </div>
        </div>

        <!-- FINANCIAL ANALYSIS TAB -->
        <div data-tab-pane v-show="activeTab === 'financial'" class="tab-pane">
          <h3>Financial Analysis</h3>

          <!-- Add this section BEFORE the "limited financial data" message -->
          <MarketBenchmarkChart :startup-name="analysisData.startupName" />

          <!-- Financial Projections -->
          <div
            v-if="
              analysisData.financialProjections &&
              analysisData.financialProjections.length > 0
            "
            class="financial-section"
          >
            <h4>Revenue Projections</h4>
            <div class="projections-table">
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Revenue</th>
                    <th>Expenses</th>
                    <th>Margins</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(proj, index) in analysisData.financialProjections"
                    :key="index"
                  >
                    <td>{{ proj.year }}</td>
                    <td>{{ proj.revenue || "N/A" }}</td>
                    <td>{{ proj.expenses || "N/A" }}</td>
                    <td>{{ proj.margins || "N/A" }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Valuation Insights -->
          <div
            v-if="
              analysisData.valuationInsights &&
              Object.keys(analysisData.valuationInsights).length > 0
            "
            class="valuation-section"
          >
            <h4>Valuation Insights</h4>
            <div class="valuation-grid">
              <div
                v-for="(value, key) in analysisData.valuationInsights"
                :key="key"
                class="valuation-card"
              >
                <strong>{{ formatLabel(key) }}</strong>
                <p>{{ value || "Not specified" }}</p>
              </div>
            </div>
          </div>

          <!-- Investment Terms -->
          <div
            v-if="
              analysisData.investmentTerms &&
              Object.keys(analysisData.investmentTerms).length > 0
            "
            class="terms-section"
          >
            <h4>Investment Terms</h4>
            <div class="terms-grid">
              <div
                v-for="(value, key) in analysisData.investmentTerms"
                :key="key"
                class="term-card"
              >
                <strong>{{ formatLabel(key) }}</strong>
                <p>{{ value || "Not specified" }}</p>
              </div>
            </div>
          </div>

          <div
            v-if="
              !analysisData.financialProjections &&
              !analysisData.valuationInsights &&
              !analysisData.investmentTerms
            "
            class="empty-state"
          >
            <p>Limited financial data available in the provided documents</p>
          </div>
        </div>

        <!-- TRACTION TAB -->
        <div data-tab-pane v-show="activeTab === 'traction'" class="tab-pane">
          <h3>Traction & Achievements</h3>
          <div v-if="analysisData.traction" class="traction-section">
            <div v-if="analysisData.traction.customers" class="traction-item">
              <h4>Customers</h4>
              <p>{{ analysisData.traction.customers }}</p>
            </div>
            <div v-if="analysisData.traction.revenue" class="traction-item">
              <h4>Revenue</h4>
              <p>{{ analysisData.traction.revenue }}</p>
            </div>
            <div v-if="analysisData.traction.users" class="traction-item">
              <h4>Users</h4>
              <p>{{ analysisData.traction.users }}</p>
            </div>
            <div
              v-if="analysisData.traction.partnerships"
              class="traction-item"
            >
              <h4>Partnerships</h4>
              <p>{{ analysisData.traction.partnerships }}</p>
            </div>
            <div v-if="analysisData.traction.awards" class="traction-item">
              <h4>Awards & Recognition</h4>
              <p>{{ analysisData.traction.awards }}</p>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>No traction data available</p>
          </div>
        </div>
      </div>

      <!-- Documents Analyzed -->
      <div class="documents-section">
        <h4>Documents Analyzed</h4>
        <div class="documents-list">
          <div
            v-for="(doc, index) in analysisData.documentsAnalyzed"
            :key="index"
            class="doc-item"
          >
            <i class="ri-file-pdf-line"></i>
            <div class="doc-info">
              <strong>{{ doc.name }}</strong>
              <span class="doc-meta"
                >{{ doc.type }} • {{ doc.pages }} pages</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Source Verification Modal -->
    <div
      v-if="showSourceModal"
      class="modal-overlay"
      @click.self="showSourceModal = false"
    >
      <div class="modal-content">
        <button class="modal-close" @click="showSourceModal = false">
          <i class="ri-close-line"></i>
        </button>

        <div class="modal-header">
          <i class="ri-verified-badge-line"></i>
          <h3>Source Verification</h3>
        </div>

        <div v-if="selectedSource" class="modal-body">
          <div class="source-item">
            <strong>Metric:</strong>
            <p>{{ selectedMetric?.label }}</p>
          </div>

          <div class="source-item">
            <strong>Source Document:</strong>
            <p>{{ selectedSource.location }}</p>
          </div>

          <div class="source-item">
            <strong>Extraction Method:</strong>
            <p>{{ selectedSource.details }}</p>
          </div>

          <div class="source-item">
            <strong>Confidence Level:</strong>
            <div
              class="confidence-indicator"
              :class="selectedSource.confidence"
            >
              {{ selectedSource.confidence.toUpperCase() }} ({{
                getConfidencePercentage(selectedSource.confidence)
              }}%)
            </div>
          </div>

          <div class="source-item">
            <strong>AI Analysis Details:</strong>
            <p>
              Data extracted using
              {{ analysisData.analysisMetadata?.aiModel || "Gemini AI" }} with
              document analysis capabilities
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn secondary" @click="showSourceModal = false">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- No Data State -->
  <div v-else class="no-data">
    <p>
      No analysis data available. Please upload and analyze a document first.
    </p>
    <router-link to="/app/new-analysis" class="btn primary">
      Start New Analysis
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAnalysisStore } from "@/stores/analysisStore";
import MarketBenchmarkChart from "../components/Molecules/MarketBenchmarkChart.vue";
import { getSectorByValue } from "../config/analysisConfig";
import ValidationSummary from "../components/Molecules/ValidationSummary.vue";

const router = useRouter();
const analysisStore = useAnalysisStore();

const analysisData = computed(() => analysisStore.analysisResult);

const activeTab = ref("summary");
const showSourceModal = ref(false);
const selectedSource = ref<any>(null);
const selectedMetric = ref<any>(null);

const getSectorLabel = (sectorValue: string) => {
  const sector = getSectorByValue(sectorValue);
  return sector?.label || sectorValue;
};

const tabs = [
  { id: "summary", name: "Executive Summary", icon: "ri-file-text-line" },
  { id: "risk", name: "Investment Risks", icon: "ri-flag-line" },
  { id: "market", name: "Market Analysis", icon: "ri-bar-chart-box-line" },
  {
    id: "financial",
    name: "Financial Analysis",
    icon: "ri-money-dollar-circle-line",
  },
  { id: "traction", name: "Traction", icon: "ri-rocket-line" },
];

const showValidationSummary = computed(() => {
  return (
    analysisStore.partialAnalysis ||
    (analysisStore.validationSummary &&
      analysisStore.validationSummary.length > 0)
  );
});

onMounted(() => {
  if (!analysisData.value) {
    console.warn("No analysis data found");
    console.log("=== ANALYSIS DATA ===");
    console.log("Full result:", analysisData.value);
    console.log("Key Metrics:", analysisData.value.keyMetrics);
    console.log("Risk Assessment:", analysisData.value.riskAssessment);
    console.log("Summary Content:", analysisData.value.summaryContent);
    console.log("Validation Issues:", analysisStore.validationSummary);
    console.log("Completeness:", analysisStore.analysisCompleteness);
    setTimeout(() => {
      router.push("/app/new-analysis");
    }, 2000);
  }
});

function getConfidenceClass() {
  const score = analysisData.value?.recommendation?.score || 0;
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function getConfidenceLevel() {
  const score = analysisData.value?.recommendation?.score || 0;
  if (score >= 75) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

function getMetricContext(label: string): string {
  const contexts: Record<string, string> = {
    "AI Projects Fail":
      "Industry benchmark showing adoption challenges in AI implementations",
    "Expected revenues in FY 25-26":
      "Company's projected near-term revenue target",
    "Time to Insights (With Sia)":
      "Processing time compared to conventional systems (3-4 days)",
    "Volume of Data Processed (With Sia)":
      "10x improvement over conventional data processing",
  };
  return contexts[label] || "Metric extracted from startup documentation";
}

function formatRiskType(type: string): string {
  const types: Record<string, string> = {
    "market-risk": "Market Risk",
    "execution-risk": "Execution Risk",
    "financial-risk": "Financial Risk",
    "technical-risk": "Technical Risk",
  };
  return types[type] || type;
}

function formatLabel(text: string): string {
  return text
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getConfidencePercentage(level: string): number {
  const map: Record<string, number> = { high: 90, medium: 70, low: 50 };
  return map[level] || 50;
}

function openSourceModal(metric: any) {
  selectedMetric.value = metric;
  selectedSource.value = metric.source;
  showSourceModal.value = true;
}

// async function handleExportPDF() {
//   try {
//     await analysisStore.exportReport();
//     alert("Report exported successfully!");
//   } catch (error: any) {
//     alert(`Export failed: ${error.message}`);
//   }
// }
async function handlePrintReport() {
  try {
    // Get all tab panes
    const tabPanes = document.querySelectorAll("[data-tab-pane]");

    // Store original display states
    const originalStates = Array.from(tabPanes).map((pane) => ({
      element: pane as HTMLElement,
      originalDisplay: (pane as HTMLElement).style.display,
      originalVisibility: (pane as HTMLElement).style.visibility,
    }));

    // Show all tabs temporarily
    tabPanes.forEach((pane) => {
      const el = pane as HTMLElement;
      el.style.display = "block";
      el.style.visibility = "visible";
    });

    // Add print styles temporarily
    const style = document.createElement("style");
    style.textContent = `
      @media print {
        .tabs-navigation { display: none; }
        .export-btn { display: none; }
        .action-buttons { display: none; }
        [data-tab-pane] {
          page-break-inside: avoid;
          page-break-after: always;
          display: block !important;
          visibility: visible !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Wait a moment for DOM to update
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Open print dialog
    window.print();

    // Restore original states
    setTimeout(() => {
      originalStates.forEach(
        ({ element, originalDisplay, originalVisibility }) => {
          element.style.display = originalDisplay;
          element.style.visibility = originalVisibility;
        }
      );
      document.head.removeChild(style);
    }, 500);
  } catch (error) {
    console.error("Print failed:", error);
  }
}
</script>

<style lang="scss" scoped>
.page-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f1929 0%, #1a2332 100%);
  padding: 40px 20px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  gap: 20px;

  .header-main {
    flex: 1;

    h1 {
      font-size: 2.2em;
      color: #ffffff;
      margin-bottom: 12px;
      font-weight: 600;
    }
  }

  .export-btn {
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;

    &.primary {
      background: linear-gradient(135deg, #00d4ff, #0099ff);
      color: white;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 212, 255, 0.3);
      }
    }
  }
}

.analysis-badges {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  .analysis-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 0.9em;
    font-weight: 500;

    &.confidence {
      background: rgba(0, 212, 255, 0.1);
      color: #00d4ff;
      border: 1px solid rgba(0, 212, 255, 0.3);

      &.high {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
        border-color: rgba(34, 197, 94, 0.3);
      }
    }
  }
}

.recommendation-box {
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.1),
    rgba(0, 153, 255, 0.05)
  );
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 40px;

  .recommendation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .label {
      font-size: 0.85em;
      color: rgba(255, 255, 255, 0.6);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }

    .badge {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.85em;
      font-weight: 500;

      &.complete {
        background: rgba(34, 197, 94, 0.2);
      }
    }
  }

  .recommendation-text {
    font-size: 2em;
    color: #00d4ff;
    margin-bottom: 20px;
    font-weight: 700;
  }

  .recommendation-score {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;

    .score-label {
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }

    .score-bar {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;

      .score-fill {
        height: 100%;
        background: linear-gradient(90deg, #00d4ff, #0099ff);
        transition: width 0.5s ease;
      }
    }

    .score-value {
      color: #00d4ff;
      font-weight: 700;
      font-size: 1.1em;
      min-width: 60px;
    }
  }

  .recommendation-justification {
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
    font-size: 1em;
  }
}

.tabs-navigation {
  display: flex;
  gap: 8px;
  margin-bottom: 40px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
  padding-bottom: 0;

  .tab-btn {
    padding: 16px 20px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    border-bottom: 3px solid transparent;
    transition: all 0.3s ease;

    i {
      font-size: 1.1em;
    }

    .tab-count {
      background: rgba(0, 212, 255, 0.2);
      color: #00d4ff;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.85em;
      margin-left: 4px;
    }

    &:hover {
      color: rgba(255, 255, 255, 0.8);
    }

    &.active {
      color: #00d4ff;
      border-bottom-color: #00d4ff;
    }
  }
}

.tab-content {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 40px;
  margin-bottom: 40px;
}

.tab-pane {
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  h3 {
    font-size: 1.5em;
    color: #ffffff;
    margin-bottom: 24px;
    font-weight: 600;
  }

  h4 {
    font-size: 1.2em;
    color: #ffffff;
    margin-bottom: 16px;
    margin-top: 24px;
    font-weight: 600;

    &:first-child {
      margin-top: 0;
    }
  }
}

.summary-section {
  margin-bottom: 32px;

  h3 {
    font-size: 1.2em;
    color: #00d4ff;
    margin-bottom: 12px;
    font-weight: 600;
  }

  p {
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.7;
    font-size: 1em;
  }
}

.metrics-section {
  margin-top: 40px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 10px;
  padding: 20px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.08);
    border-color: rgba(0, 212, 255, 0.4);
  }

  .metric-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;

    h4 {
      margin: 0;
      color: #ffffff;
      font-size: 0.95em;
      font-weight: 600;
      flex: 1;
    }

    .confidence-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75em;
      font-weight: 600;
      text-transform: uppercase;
      white-space: nowrap;
      margin-left: 8px;

      &.high {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
      }

      &.medium {
        background: rgba(234, 179, 8, 0.2);
        color: #eab308;
      }

      &.low {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
    }
  }

  .metric-value {
    font-size: 1.8em;
    color: #00d4ff;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .metric-context {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9em;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  .verify-btn {
    width: 100%;
    padding: 8px 12px;
    background: rgba(0, 212, 255, 0.1);
    border: 1px solid rgba(0, 212, 255, 0.3);
    color: #00d4ff;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    &:hover {
      background: rgba(0, 212, 255, 0.2);
      border-color: rgba(0, 212, 255, 0.5);
    }
  }
}

.risks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.risk-card {
  background: rgba(255, 255, 255, 0.03);
  border-left: 4px solid;
  border-radius: 8px;
  padding: 20px;

  &.risk-high {
    border-left-color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
  }

  &.risk-medium {
    border-left-color: #eab308;
    background: rgba(234, 179, 8, 0.05);
  }

  &.risk-low {
    border-left-color: #22c55e;
    background: rgba(34, 197, 94, 0.05);
  }

  .risk-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .risk-type {
      font-size: 0.9em;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
      text-transform: uppercase;
    }

    .risk-level {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.8em;
      font-weight: 600;
      text-transform: uppercase;

      &.high {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }

      &.medium {
        background: rgba(234, 179, 8, 0.2);
        color: #eab308;
      }

      &.low {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
      }
    }
  }

  h4 {
    margin: 0 0 12px 0;
    color: #ffffff;
    font-size: 1.1em;
    font-weight: 600;
  }

  .risk-description {
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 16px;
    line-height: 1.5;
  }

  .risk-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    .detail-item {
      background: rgba(255, 255, 255, 0.05);
      padding: 12px;
      border-radius: 6px;

      strong {
        color: rgba(255, 255, 255, 0.9);
        display: block;
        margin-bottom: 6px;
        font-size: 0.9em;
      }

      p {
        color: rgba(255, 255, 255, 0.7);
        margin: 0;
        font-size: 0.9em;
        line-height: 1.4;
      }
    }
  }
}

.market-sizing {
  margin-bottom: 40px;

  h4 {
    margin-bottom: 20px;
  }
}

.sizing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.sizing-card {
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  text-align: center;

  .sizing-label {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9em;
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .sizing-value {
    color: #00d4ff;
    font-size: 1.4em;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .sizing-desc {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85em;
  }
}

.competitive-section {
  margin-top: 30px;
}

.competitors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.competitor-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;

  h5 {
    color: #00d4ff;
    margin: 0 0 12px 0;
    font-size: 1em;
    font-weight: 600;
  }

  .comp-detail {
    margin-bottom: 12px;

    strong {
      color: rgba(255, 255, 255, 0.8);
      display: block;
      margin-bottom: 4px;
      font-size: 0.9em;
    }

    p {
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
      font-size: 0.9em;
      line-height: 1.4;
    }
  }
}

.financial-section {
  margin-bottom: 30px;
}

.projections-table {
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;

    thead {
      background: rgba(0, 212, 255, 0.1);

      th {
        padding: 12px;
        color: #00d4ff;
        font-weight: 600;
        text-align: left;
        font-size: 0.95em;
        border-bottom: 2px solid rgba(0, 212, 255, 0.2);
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);

        &:hover {
          background: rgba(0, 212, 255, 0.05);
        }

        td {
          padding: 12px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.95em;
        }
      }
    }
  }
}

.valuation-section {
  margin-top: 30px;
}

.valuation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.valuation-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;

  strong {
    color: rgba(255, 255, 255, 0.9);
    display: block;
    margin-bottom: 8px;
    font-size: 0.95em;
  }

  p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    font-size: 0.9em;
    line-height: 1.4;
  }
}

.terms-section {
  margin-top: 30px;
}

.terms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.term-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;

  strong {
    color: rgba(255, 255, 255, 0.9);
    display: block;
    margin-bottom: 8px;
    font-size: 0.95em;
  }

  p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    font-size: 0.9em;
  }
}

.traction-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;

  .traction-item {
    background: rgba(34, 197, 94, 0.05);
    border: 1px solid rgba(34, 197, 94, 0.2);
    border-radius: 8px;
    padding: 16px;

    h4 {
      margin: 0 0 12px 0;
      color: #22c55e;
      font-size: 1em;
      font-weight: 600;
    }

    p {
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
      line-height: 1.5;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1em;
}

.documents-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 40px;

  h4 {
    color: #ffffff;
    margin: 0 0 16px 0;
    font-size: 1.1em;
    font-weight: 600;
  }
}

.documents-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.doc-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.1);
  border-radius: 8px;

  i {
    color: #00d4ff;
    font-size: 1.5em;
  }

  .doc-info {
    flex: 1;

    strong {
      color: #ffffff;
      display: block;
      margin-bottom: 4px;
    }

    .doc-meta {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.85em;
    }
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #1a2332;
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.5em;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: #ffffff;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 16px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);

  i {
    color: #22c55e;
    font-size: 1.5em;
  }

  h3 {
    margin: 0;
    color: #ffffff;
    font-size: 1.2em;
    font-weight: 600;
  }
}

.modal-body {
  padding: 24px;

  .source-item {
    margin-bottom: 20px;

    strong {
      color: rgba(255, 255, 255, 0.9);
      display: block;
      margin-bottom: 8px;
      font-size: 0.95em;
    }

    p {
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
      line-height: 1.5;
    }

    .confidence-indicator {
      background: rgba(255, 255, 255, 0.05);
      padding: 8px 12px;
      border-radius: 6px;
      font-weight: 600;
      margin: 0;

      &.high {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
      }

      &.medium {
        background: rgba(234, 179, 8, 0.2);
        color: #eab308;
      }

      &.low {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
    }
  }
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 212, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .btn {
    padding: 8px 16px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;

    &.secondary {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);

      &:hover {
        background: rgba(255, 255, 255, 0.15);
      }
    }
  }
}

.no-data {
  text-align: center;
  padding: 100px 20px;
  color: rgba(255, 255, 255, 0.6);

  p {
    margin-bottom: 20px;
    font-size: 1.1em;
  }

  .btn {
    display: inline-block;
    padding: 12px 24px;
    background: linear-gradient(135deg, #00d4ff, #0099ff);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 212, 255, 0.3);
    }
  }
}
.sector-info {
  display: flex;
  gap: 16px;
  margin: 20px 0 10px 0;
  align-items: center;
  flex-wrap: wrap;
}

.sector-badge,
.industry-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border: 1px solid #667eea;
}

.industry-badge {
  background: rgba(240, 147, 251, 0.1);
  color: #f093fb;
  border-color: #f093fb;
}

@media (max-width: 768px) {
  .sector-info {
    margin-top: 16px;
    gap: 12px;
  }

  .sector-badge,
  .industry-badge {
    font-size: 0.85rem;
    padding: 8px 12px;
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;

    .export-btn {
      width: 100%;
      justify-content: center;
    }
  }

  .tabs-navigation {
    .tab-btn {
      padding: 12px 16px;
      font-size: 0.9em;
    }
  }

  .metrics-grid,
  .risks-grid,
  .sizing-grid,
  .competitors-grid,
  .valuation-grid,
  .terms-grid,
  .traction-section,
  .documents-list {
    grid-template-columns: 1fr;
  }

  .tab-content {
    padding: 20px;
  }

  .modal-content {
    max-width: 90vw;
  }
}
</style>
