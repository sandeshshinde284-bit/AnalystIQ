<template>
  <div
    v-if="parsedData && parsedData.metrics.length > 0"
    class="benchmarking-display"
  >
    <!-- Summary Stats -->
    <div class="summary-stats">
      <div v-for="(stat, idx) in summaryStats" :key="idx" class="stat-card">
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-value" :style="{ color: stat.color }">
          {{ stat.icon }} {{ stat.value }}
        </div>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="metrics-section">
      <h4>📊 Metric-by-Metric Analysis</h4>
      <div class="metrics-grid">
        <div
          v-for="(metric, idx) in parsedData.metrics"
          :key="idx"
          class="metric-card"
          :class="`severity-${metric.issueSeverity}`"
          @click="toggleMetric(idx)"
        >
          <!-- Header -->
          <div class="metric-header">
            <div class="metric-info">
              <div class="metric-name">{{ metric.name }}</div>
              <div class="metric-values">
                <div class="value-item">
                  <span class="label">Your Value:</span>
                  <span class="value">{{ metric.value }}</span>
                </div>
              </div>
            </div>
            <div class="severity-icon">
              {{ severityConfig[metric.issueSeverity].icon }}
            </div>
          </div>

          <!-- Benchmark -->
          <div class="benchmark-box">
            <span class="label">Industry Benchmark:</span>
            <span class="value">{{ metric.benchmark }}</span>
          </div>

          <!-- Assessment -->
          <div
            class="assessment-box"
            :class="`assessment-${metric.issueSeverity}`"
          >
            {{ metric.assessment || "Assessment pending" }}
          </div>

          <!-- Expanded Details -->
          <transition name="expand">
            <div v-show="expandedMetric === idx" class="metric-details">
              <div class="details-content">
                <h5>Investment Implication</h5>
                <p>{{ metric.implication || "See assessment above" }}</p>
              </div>
            </div>
          </transition>

          <!-- Click Indicator -->
          <div v-if="expandedMetric !== idx" class="click-hint">
            Click to see details
          </div>
        </div>
      </div>
    </div>

    <!-- Key Takeaways -->
    <div
      v-if="parsedData.takeaways && parsedData.takeaways.length > 0"
      class="takeaways-section"
    >
      <h4>🎯 Key Takeaways & Recommendations</h4>
      <div class="takeaways-box">
        <div
          v-for="(takeaway, idx) in parsedData.takeaways"
          :key="idx"
          class="takeaway-item"
        >
          <div class="bullet"></div>
          <div class="text">{{ takeaway }}</div>
        </div>
      </div>
    </div>

    <!-- Raw Data Toggle -->
    <details class="raw-data-toggle">
      <summary>📋 View Raw Data</summary>
      <pre>{{ benchmarkingText }}</pre>
    </details>
  </div>

  <!-- Empty State -->
  <div v-else class="empty-state">
    <i class="ri-database-2-line"></i>
    <p>Benchmark analysis not available for this startup</p>
    <span class="hint"
      >Upload documents with financial metrics to see benchmarking data</span
    >
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface MetricData {
  name: string;
  value: string;
  benchmark: string;
  assessment: string;
  implication: string;
  issueSeverity: string;
}

interface ParsedBenchmarkData {
  metrics: MetricData[];
  takeaways: string[];
}

const props = defineProps<{
  benchmarkingText: string;
}>();

const expandedMetric = ref<number | null>(null);

const severityConfig = {
  high: {
    bg: "rgba(239, 68, 68, 0.08)",
    border: "#ef4444",
    color: "#ef4444",
    icon: "⚠️",
  },
  medium: {
    bg: "rgba(234, 179, 8, 0.08)",
    border: "#eab308",
    color: "#eab308",
    icon: "⚡",
  },
  low: {
    bg: "rgba(34, 197, 94, 0.08)",
    border: "#22c55e",
    color: "#22c55e",
    icon: "✓",
  },
  neutral: {
    bg: "rgba(0, 212, 255, 0.08)",
    border: "#00d4ff",
    color: "#00d4ff",
    icon: "ℹ️",
  },
};

// FIX: Parse benchmarking text into structured data
const parsedData = computed((): ParsedBenchmarkData | null => {
  if (!props.benchmarkingText || typeof props.benchmarkingText !== "string") {
    console.log("❌ No benchmarking text provided");
    return null;
  }

  try {
    const metrics: MetricData[] = [];
    const lines = props.benchmarkingText.split("\n");

    console.log(`📄 Parsing ${lines.length} lines of benchmarking data`);

    // Parse table rows - FIXED LOGIC
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines, headers, and separator lines
      if (!trimmed) continue;
      if (trimmed.includes("Metric") && trimmed.includes("Benchmark")) continue; // Header row
      if (trimmed.startsWith("|---") || trimmed.includes("---|")) continue; // Separator row
      if (!trimmed.includes("|")) continue; // Not a table row

      // Split by pipe and clean up
      const parts = trimmed
        .split("|")
        .map((p) => p.trim())
        .filter((p) => p); // Remove empty strings

      // We need at least 5 parts: metric | value | benchmark | assessment | implication
      if (parts.length >= 4) {
        const metric: MetricData = {
          name: parts[0],
          value: parts[1],
          benchmark: parts[2],
          assessment: parts[3] || "",
          implication: parts[4] || "",
          issueSeverity: determineIssueSeverity(parts[3] || ""),
        };

        console.log(`✓ Parsed metric: ${metric.name}`);
        metrics.push(metric);
      }
    }

    // Extract key takeaways - FIXED REGEX
    const takeaways: string[] = [];

    // Look for "Key Takeaways" section with various formats
    const takeawaysSectionMatch = props.benchmarkingText.match(
      /\*\*Key Takeaways.*?\*\*([\s\S]*?)(?=\*\*[A-Z]|\n\n|$)/i
    );

    if (takeawaysSectionMatch) {
      const takeawaysText = takeawaysSectionMatch[1];
      console.log("✓ Found Key Takeaways section");

      // Split by bullet points (lines starting with *)
      const lines = takeawaysText.split("\n");
      for (const line of lines) {
        const trimmedLine = line.trim();
        // Match lines that start with * (bullet points)
        if (trimmedLine.startsWith("*") || trimmedLine.startsWith("- ")) {
          const cleaned = trimmedLine
            .replace(/^\*\s*/, "") // Remove leading *
            .replace(/^-\s*/, "") // Remove leading -
            .trim();

          if (cleaned.length > 0) {
            console.log(`✓ Found takeaway: ${cleaned.substring(0, 50)}...`);
            takeaways.push(cleaned);
          }
        }
      }
    } else {
      console.log("⚠️ No Key Takeaways section found");
    }

    console.log(
      `📊 Final result: ${metrics.length} metrics, ${takeaways.length} takeaways`
    );

    if (metrics.length === 0) {
      console.warn("⚠️ Warning: No metrics were parsed from the text");
      return null;
    }

    return { metrics, takeaways };
  } catch (error) {
    console.error("❌ Error parsing benchmarking data:", error);
    return null;
  }
});

// Summary statistics
const summaryStats = computed(() => {
  if (!parsedData.value) return [];

  const metrics = parsedData.value.metrics;
  const highCount = metrics.filter((m) => m.issueSeverity === "high").length;
  const mediumCount = metrics.filter(
    (m) => m.issueSeverity === "medium"
  ).length;
  const lowCount = metrics.filter((m) => m.issueSeverity === "low").length;

  return [
    {
      label: "Total Metrics",
      value: metrics.length,
      color: "#00d4ff",
      icon: "📊",
    },
    {
      label: "Areas of Concern",
      value: highCount,
      color: "#ef4444",
      icon: "⚠️",
    },
    {
      label: "Moderate Areas",
      value: mediumCount,
      color: "#eab308",
      icon: "⚡",
    },
    { label: "Strong Areas", value: lowCount, color: "#22c55e", icon: "✓" },
  ];
});

function determineIssueSeverity(assessment: string): string {
  const lower = assessment.toLowerCase();

  // Check for emojis and keywords
  if (
    lower.includes("🔴") ||
    lower.includes("red") ||
    lower.includes("concern") ||
    lower.includes("below average")
  ) {
    return "high";
  }
  if (
    lower.includes("🟡") ||
    lower.includes("yellow") ||
    lower.includes("medium") ||
    lower.includes("average")
  ) {
    return "medium";
  }
  if (
    lower.includes("🟢") ||
    lower.includes("green") ||
    lower.includes("above") ||
    lower.includes("excellent")
  ) {
    return "low";
  }

  return "neutral";
}

function toggleMetric(idx: number): void {
  expandedMetric.value = expandedMetric.value === idx ? null : idx;
}
</script>

<style lang="scss" scoped>
$color-accent: #00d4ff;

.benchmarking-display {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(0, 212, 255, 0.15);
  border-radius: 8px;
  padding: 16px;
  text-align: center;

  .stat-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 8px;
    text-transform: uppercase;
    font-weight: 600;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
}

.metrics-section {
  h4 {
    margin: 0 0 20px 0;
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
  }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.metric-card {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid;
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all 0.3s ease;

  &.severity-high {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.08);

    &:hover {
      box-shadow: 0 8px 24px rgba(239, 68, 68, 0.15);
    }
  }

  &.severity-medium {
    border-color: #eab308;
    background: rgba(234, 179, 8, 0.08);

    &:hover {
      box-shadow: 0 8px 24px rgba(234, 179, 8, 0.15);
    }
  }

  &.severity-low {
    border-color: #22c55e;
    background: rgba(34, 197, 94, 0.08);

    &:hover {
      box-shadow: 0 8px 24px rgba(34, 197, 94, 0.15);
    }
  }

  &.severity-neutral {
    border-color: #00d4ff;
    background: rgba(0, 212, 255, 0.08);

    &:hover {
      box-shadow: 0 8px 24px rgba(0, 212, 255, 0.15);
    }
  }

  &:hover {
    transform: translateY(-2px);
  }
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.metric-info {
  flex: 1;
}

.metric-name {
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  word-break: break-word;
}

.metric-values {
  display: flex;
  gap: 16px;
  font-size: 12px;
  flex-wrap: wrap;
}

.value-item {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .label {
    color: rgba(255, 255, 255, 0.5);
    font-size: 10px;
    text-transform: uppercase;
  }

  .value {
    color: $color-accent;
    font-weight: 600;
    word-break: break-word;
  }
}

.severity-icon {
  font-size: 24px;
  margin-left: 12px;
  flex-shrink: 0;
}

.benchmark-box {
  background: rgba(255, 255, 255, 0.03);
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    color: rgba(255, 255, 255, 0.5);
  }

  .value {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
    word-break: break-word;
  }
}

.assessment-box {
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 12px;
  word-break: break-word;

  &.assessment-high {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }

  &.assessment-medium {
    background: rgba(234, 179, 8, 0.2);
    border: 1px solid rgba(234, 179, 8, 0.3);
    color: #eab308;
  }

  &.assessment-low {
    background: rgba(34, 197, 94, 0.2);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
  }

  &.assessment-neutral {
    background: rgba(0, 212, 255, 0.2);
    border: 1px solid rgba(0, 212, 255, 0.3);
    color: #00d4ff;
  }
}

.metric-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.details-content {
  h5 {
    margin: 0 0 8px 0;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.5;
    word-break: break-word;
  }
}

.click-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 8px;
  text-align: center;
}

.takeaways-section {
  h4 {
    margin: 0 0 20px 0;
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
  }
}

.takeaways-box {
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.05),
    rgba(34, 197, 94, 0.02)
  );
  border: 1px solid rgba(0, 212, 255, 0.15);
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.takeaway-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;

  .bullet {
    width: 24px;
    height: 24px;
    min-width: 24px;
    background: rgba(0, 212, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: $color-accent;
    font-weight: 600;

    &::before {
      content: "•";
    }
  }

  .text {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.5;
    word-break: break-word;
  }
}

.raw-data-toggle {
  opacity: 0.6;
  cursor: pointer;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;

  summary {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 500;
    cursor: pointer;
  }

  pre {
    margin-top: 12px;
    background: rgba(0, 0, 0, 0.3);
    padding: 12px;
    border-radius: 6px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    overflow: auto;
    max-height: 300px;
    word-break: break-word;
    white-space: pre-wrap;
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.5);

  i {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
  }

  p {
    margin: 0 0 8px 0;
    font-size: 15px;
    color: rgba(255, 255, 255, 0.7);
  }

  .hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
  }
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 12px;

    .stat-value {
      font-size: 24px;
    }
  }

  .metric-card {
    padding: 12px;
  }

  .metric-header {
    flex-direction: column;
  }

  .severity-icon {
    margin-left: 0;
    margin-top: 8px;
  }
}
</style>
