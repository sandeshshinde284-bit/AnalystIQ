<template>
  <div
    v-if="showValidationSummary"
    class="validation-summary-section"
    :class="completenessClass"
  >
    <div class="validation-header" @click="expanded = !expanded">
      <div class="header-content">
        <i :class="completenessIcon"></i>

        <div>
          <h3>Analysis Quality Report</h3>
          <p class="subtitle">
            {{ isPartialAnalysis ? "Partial Analysis" : "Complete Analysis" }} •
            {{ completeness }}% Complete
          </p>
        </div>
      </div>

      <button class="collapse-btn" @click.stop="expanded = !expanded">
        <i
          :class="expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"
        ></i>
      </button>
    </div>

    <div v-if="expanded" class="validation-details">
      <!-- COMPLETENESS BAR -->
      <div class="completeness-section">
        <div class="progress-label">
          <span>Data Completeness</span>
          <span class="value">{{ completeness }}%</span>
        </div>

        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: completeness + '%' }"
          ></div>
        </div>

        <p class="progress-note">
          {{ completenessMessage }}
        </p>
      </div>

      <!-- VALIDATION ISSUES BY SEVERITY -->
      <div v-if="hasIssues" class="issues-section">
        <!-- WARNING ISSUES -->
        <div v-if="warningIssues.length > 0" class="issue-group">
          <h4 class="issue-group-title warning">
            <i class="ri-alert-line"></i> Warnings ({{ warningIssues.length }})
          </h4>

          <div class="issues-list">
            <div
              v-for="(issue, idx) in warningIssues"
              :key="`warning-${idx}`"
              class="issue-item warning"
            >
              <div class="issue-icon">
                <i class="ri-alert-line"></i>
              </div>

              <div class="issue-content">
                <strong>{{ issue.title }}</strong>
                <p>{{ issue.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- INFO ISSUES -->
        <div v-if="infoIssues.length > 0" class="issue-group">
          <h4 class="issue-group-title info">
            <i class="ri-information-line"></i> Information ({{
              infoIssues.length
            }})
          </h4>

          <div class="issues-list">
            <div
              v-for="(issue, idx) in infoIssues"
              :key="`info-${idx}`"
              class="issue-item info"
            >
              <div class="issue-icon">
                <i class="ri-information-line"></i>
              </div>

              <div class="issue-content">
                <strong>{{ issue.title }}</strong>
                <p>{{ issue.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="no-issues">
        <i class="ri-check-double-line"></i>
        <p>All data extracted successfully</p>
      </div>

      <!-- RECOMMENDATIONS -->
      <div class="recommendations-section">
        <h4>Recommendations</h4>

        <ul class="recommendations-list">
          <li v-if="isPartialAnalysis">
            <i class="ri-lightbulb-line"></i>
            <span>
              Consider uploading additional documents with more detailed
              information to improve analysis completeness
            </span>
          </li>

          <li v-if="warningIssues.length > 0">
            <i class="ri-lightbulb-line"></i>
            <span>
              Some data validation warnings detected. Cross-reference with
              source documents
            </span>
          </li>

          <li>
            <i class="ri-lightbulb-line"></i>
            <span
              >Use this analysis in combination with manual due diligence</span
            >
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useAnalysisStore } from "@/stores/analysisStore";

interface ValidationIssue {
  type: string;
  level: "warning" | "info";
  title: string;
  description: string;
}

const analysisStore = useAnalysisStore();
const expanded = ref(true);

const isPartialAnalysis = computed(() => analysisStore.partialAnalysis);
const completeness = computed(() => analysisStore.analysisCompleteness);
const validationSummary = computed<ValidationIssue[]>(
  () => (analysisStore.validationSummary as ValidationIssue[]) || []
);

const showValidationSummary = computed(() => {
  return validationSummary.value.length > 0 || isPartialAnalysis.value;
});

const warningIssues = computed(() =>
  validationSummary.value.filter((i) => i.level === "warning")
);

const infoIssues = computed(() =>
  validationSummary.value.filter((i) => i.level === "info")
);

const hasIssues = computed(() => validationSummary.value.length > 0);

// ========== DEBUG LOGS - ADD THIS SECTION ==========
watch(
  () => validationSummary.value,
  (newVal) => {
    console.log("=== ValidationSummary Component Debug ===");
    console.log("Full validationSummary:", JSON.stringify(newVal, null, 2));
    console.log("Warning issues count:", warningIssues.value.length);
    console.log(
      "Warning issues:",
      JSON.stringify(warningIssues.value, null, 2)
    );
    console.log("Info issues count:", infoIssues.value.length);
    console.log("Info issues:", JSON.stringify(infoIssues.value, null, 2));
    console.log("Has issues:", hasIssues.value);
    console.log("Show validation summary:", showValidationSummary.value);
  },
  { deep: true }
);

// Also log on mount to see initial state
watch(
  () => isPartialAnalysis.value,
  (newVal) => {
    console.log("Partial analysis changed to:", newVal);
    console.log("Completeness:", completeness.value);
  },
  { deep: true }
);
// ========== END DEBUG LOGS ==========

const completenessIcon = computed(() => {
  if (completeness.value >= 90) return "ri-checkbox-circle-fill success";
  if (completeness.value >= 70) return "ri-alert-line warning";
  return "ri-error-warning-fill critical";
});

const completenessClass = computed(() => {
  if (completeness.value < 75) return "completeness-low";
  if (completeness.value < 90) return "completeness-medium";
  return "completeness-high";
});

const completenessMessage = computed(() => {
  if (completeness.value >= 95) {
    return "Excellent - All critical data extracted successfully";
  }
  if (completeness.value >= 80) {
    return "Good - Most data extracted, some information incomplete";
  }
  if (completeness.value >= 60) {
    return "Fair - Core data extracted, significant gaps remain";
  }
  return "Limited - Insufficient data for complete analysis";
});
</script>

<style lang="scss" scoped>
$warning-color: #eab308;
$info-color: #3b82f6;
$success-color: #22c55e;
$error-color: #ef4444;
$accent-color: #00d4ff;

.validation-summary-section {
  background: rgba(255, 255, 255, 0.02);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top: 5px solid rgba(255, 255, 255, 0.1); // ← ADD THIS
  border-radius: 12px;
  margin: 30px 0;
  overflow: hidden;
  transition: all 0.3s ease;

  // 🔴 RED TOP BAR - INCOMPLETE (< 75%)
  &.completeness-low {
    border-top-color: #dc2626;
    border-color: rgba(220, 38, 38, 0.2);
  }

  // 🟡 ORANGE TOP BAR - PARTIAL (75-89%)
  &.completeness-medium {
    border-top-color: #eab308;
    border-color: rgba(234, 179, 8, 0.2);
  }

  // 🟢 GREEN TOP BAR - COMPLETE (90%+)
  &.completeness-high {
    border-top-color: #22c55e;
    border-color: rgba(34, 197, 94, 0.2);
  }
}

.validation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 16px;

    .icon-wrapper {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      flex-shrink: 0;

      i {
        font-size: 24px;
      }

      &.success {
        background: rgba($success-color, 0.15);
        border: 1px solid rgba($success-color, 0.3);

        i {
          color: $success-color;
        }
      }

      &.warning {
        background: rgba($warning-color, 0.15);
        border: 1px solid rgba($warning-color, 0.3);

        i {
          color: $warning-color;
        }
      }

      &.error {
        background: rgba($error-color, 0.15);
        border: 1px solid rgba($error-color, 0.3);

        i {
          color: $error-color;
        }
      }
    }

    h3 {
      margin: 0 0 4px 0;
      color: #ffffff;
      font-size: 1.1em;
      font-weight: 600;
    }

    .subtitle {
      margin: 0;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9em;
    }

    .completeness-badge {
      margin-left: auto;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.85em;
      font-weight: 600;

      &.high {
        background: rgba($success-color, 0.2);
        color: $success-color;
      }

      &.medium {
        background: rgba($warning-color, 0.2);
        color: $warning-color;
      }

      &.low {
        background: rgba($error-color, 0.2);
        color: $error-color;
      }
    }
  }

  .collapse-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    font-size: 1.2em;
    transition: all 0.3s;
    padding: 4px 8px;

    &:hover {
      color: $accent-color;
      transform: scale(1.1);
    }
  }
}

.validation-details {
  padding: 24px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.completeness-section {
  margin-bottom: 32px;
  padding: 16px;
  background: rgba($accent-color, 0.05);
  border-radius: 8px;
  border-left: 4px solid $accent-color;

  .progress-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 0.9em;

    span {
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;

      &.value {
        font-weight: 700;
        font-size: 1.1em;
        color: $accent-color;
      }
    }
  }

  .progress-bar {
    height: 10px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 12px;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, $accent-color, #0099ff);
      transition: width 0.5s ease;
      box-shadow: 0 0 10px rgba($accent-color, 0.3);
    }
  }

  .progress-note {
    margin: 0;
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
    font-style: italic;
  }
}

.issues-section {
  margin-bottom: 24px;
}

.issue-group {
  margin-bottom: 20px;

  .issue-group-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 12px 0;
    font-size: 0.95em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding-bottom: 8px;
    border-bottom: 2px solid;

    i {
      font-size: 1.2em;
    }

    &.warning {
      color: $warning-color;
      border-bottom-color: rgba($warning-color, 0.3);
    }

    &.info {
      color: $info-color;
      border-bottom-color: rgba($info-color, 0.3);
    }
  }
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.issue-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.02);
  border-left: 4px solid;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &.warning {
    border-left-color: $warning-color;
    background: rgba($warning-color, 0.08);

    &:hover {
      background: rgba($warning-color, 0.12);
      border-left-color: rgba($warning-color, 0.8);
    }
  }

  &.info {
    border-left-color: $info-color;
    background: rgba($info-color, 0.08);

    &:hover {
      background: rgba($info-color, 0.12);
      border-left-color: rgba($info-color, 0.8);
    }
  }

  .issue-icon {
    flex-shrink: 0;
    font-size: 1.2em;
    margin-top: 3px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      color: currentColor;
    }
  }

  .issue-content {
    flex: 1;
    min-width: 0;

    strong {
      display: block;
      color: rgba(255, 255, 255, 0.95);
      font-size: 0.95em;
      margin-bottom: 4px;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: rgba(255, 255, 255, 0.75);
      font-size: 0.85em;
      line-height: 1.5;
    }
  }
}

.no-issues {
  text-align: center;
  padding: 24px;
  background: linear-gradient(
    135deg,
    rgba($success-color, 0.08),
    rgba($success-color, 0.04)
  );
  border: 2px solid rgba($success-color, 0.2);
  border-radius: 12px;

  i {
    display: block;
    font-size: 2.5em;
    color: $success-color;
    margin-bottom: 12px;
    animation: bounce 2s infinite;
  }

  p {
    margin: 0;
    color: $success-color;
    font-weight: 600;
    font-size: 0.95em;
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-4px);
  }
}

.recommendations-section {
  margin-top: 24px;
  padding: 16px;
  background: rgba($accent-color, 0.05);
  border-radius: 8px;
  border-left: 4px solid $accent-color;

  h4 {
    margin: 0 0 12px 0;
    color: $accent-color;
    font-size: 0.95em;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      font-size: 1.1em;
    }
  }

  .recommendations-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;

    li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.75);
      font-size: 0.9em;
      line-height: 1.5;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
        transform: translateX(4px);
      }

      i {
        flex-shrink: 0;
        color: $accent-color;
        margin-top: 3px;
        font-weight: bold;
      }

      span {
        flex: 1;
      }
    }
  }
}

@media (max-width: 768px) {
  .validation-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .header-content {
      width: 100%;

      .completeness-badge {
        margin-left: 0;
        margin-top: 8px;
      }
    }

    .collapse-btn {
      align-self: flex-end;
    }
  }

  .validation-details {
    padding: 16px;
  }

  .issue-item {
    flex-direction: row;

    &:hover {
      transform: translateX(2px);
    }
  }
}
</style>
