<!-- C:\Google-Hack\Projects\AnalystIQ\frontend\src\components\Molecules\MetricCard.vue -->

<template>
  <div class="metric-card glassmorphism">
    <div class="metric-header">
      <div class="metric-icon" :style="{ backgroundColor: iconBg }">
        <i :class="icon" :style="{ color: iconColor }"></i>
      </div>
      <div class="metric-info">
        <h4 class="metric-label">{{ label }}</h4>
        <div class="metric-value">
          {{ formattedValue }}
          <span v-if="unit" class="metric-unit">{{ unit }}</span>
        </div>
      </div>
    </div>

    <!-- ✅ FIXED: Added proper type guards and defaults -->
    <div
      v-if="showChart && safeChartType && safeChartValue !== undefined"
      class="metric-chart"
    >
      <MiniChart
        :type="safeChartType"
        :value="safeChartValue"
        :max="chartMax || 100"
        :data="trendData || []"
        :color="chartColor || iconColor"
      />
    </div>

    <div v-if="trend" class="metric-trend" :class="trendClass">
      <i :class="trendIcon"></i>
      <span>{{ trendText }}</span>
    </div>

    <div v-if="source" class="metric-source">
      <i class="ri-information-line"></i>
      <span>{{ source.type }}: {{ source.location }}</span>
      <div class="confidence-badge" :class="confidenceClass">
        {{ source.confidence }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import MiniChart from "../Atoms/MiniChart.vue";

// ✅ PROPER TYPE DEFINITIONS
interface Source {
  type: string;
  location: string;
  confidence: string;
}

interface Trend {
  direction: "up" | "down" | "stable";
  value: number;
  period: string;
}

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  iconColor?: string;
  iconBg?: string;
  trend?: Trend;
  source?: Source;
  chartType?: "progress" | "trend" | "gauge";
  chartValue?: number;
  chartMax?: number;
  trendData?: number[];
  chartColor?: string;
  showChart?: boolean;
}

// ✅ DEFINE PROPS WITH PROPER TYPES
const props = withDefaults(defineProps<Props>(), {
  unit: "",
  iconColor: "#00d4ff",
  iconBg: "rgba(0, 212, 255, 0.1)",
  chartMax: 100,
  chartColor: "#00d4ff",
  showChart: false,
  trendData: () => [],
});

// ✅ SAFE COMPUTED VALUES WITH TYPE GUARDS
const safeChartType = computed((): "progress" | "trend" | "gauge" | null => {
  if (!props.chartType) return null;
  if (["progress", "trend", "gauge"].includes(props.chartType)) {
    return props.chartType;
  }
  return null;
});

const safeChartValue = computed((): number | undefined => {
  if (typeof props.chartValue === "number" && !isNaN(props.chartValue)) {
    return props.chartValue;
  }
  return undefined;
});

const formattedValue = computed((): string => {
  if (typeof props.value === "number") {
    // Format large numbers
    if (props.value >= 1000000) {
      return (props.value / 1000000).toFixed(1) + "M";
    } else if (props.value >= 1000) {
      return (props.value / 1000).toFixed(1) + "K";
    }
    return props.value.toLocaleString();
  }
  return String(props.value);
});

const trendClass = computed((): string => {
  if (!props.trend) return "";
  return `trend-${props.trend.direction}`;
});

const trendIcon = computed((): string => {
  if (!props.trend) return "";
  switch (props.trend.direction) {
    case "up":
      return "ri-arrow-up-line";
    case "down":
      return "ri-arrow-down-line";
    case "stable":
      return "ri-subtract-line";
    default:
      return "ri-subtract-line";
  }
});

const trendText = computed((): string => {
  if (!props.trend) return "";
  const sign =
    props.trend.direction === "up"
      ? "+"
      : props.trend.direction === "down"
        ? "-"
        : "";
  return `${sign}${Math.abs(props.trend.value)}% ${props.trend.period}`;
});

const confidenceClass = computed((): string => {
  if (!props.source) return "";
  const confidence = props.source.confidence.toLowerCase();
  if (confidence.includes("high")) return "confidence-high";
  if (confidence.includes("medium")) return "confidence-medium";
  return "confidence-low";
});
</script>

<style lang="scss" scoped>
$color-accent: #00d4ff;

.metric-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: rgba($color-accent, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, $color-accent, #00a2ff);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::before {
    opacity: 1;
  }
}

.metric-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 24px;
  }
}

.metric-info {
  flex: 1;
  min-width: 0;
}

.metric-label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  align-items: baseline;
  gap: 4px;
  line-height: 1.1;
  word-break: break-all;
}

.metric-unit {
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

.metric-chart {
  margin: 16px 0;
  height: 60px;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 13px;
  font-weight: 500;

  i {
    font-size: 16px;
  }

  &.trend-up {
    color: #22c55e;
  }

  &.trend-down {
    color: #ef4444;
  }

  &.trend-stable {
    color: #f59e0b;
  }
}

.metric-source {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);

  i {
    font-size: 14px;
    color: $color-accent;
  }

  span {
    flex: 1;
  }
}

.confidence-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.confidence-high {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  &.confidence-medium {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  &.confidence-low {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
}

// Responsive design
@media (max-width: 768px) {
  .metric-card {
    padding: 20px;
  }

  .metric-value {
    font-size: 24px;
  }

  .metric-header {
    gap: 12px;
  }

  .metric-icon {
    width: 40px;
    height: 40px;

    i {
      font-size: 20px;
    }
  }
}
</style>
