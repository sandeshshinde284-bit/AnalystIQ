<template>
  <div class="traction-metric-card" :class="metricType">
    <div class="card-header">
      <div class="icon-wrapper" :style="{ background: iconBg }">
        <i :class="icon" :style="{ color: iconColor }"></i>
      </div>
      <div class="header-content">
        <h4 class="metric-title">{{ title }}</h4>
        <span v-if="badge" class="metric-badge">{{ badge }}</span>
      </div>
    </div>

    <div class="metric-value-section">
      <!-- ✅ ADD: Expandable text with click handler -->
      <div
        class="primary-value"
        :class="{ expanded: isExpanded, collapsed: !isExpanded && isLongText }"
      >
        {{ displayValue }}
      </div>
      <div v-if="growth" class="growth-indicator" :class="growthClass">
        <i :class="growthIcon"></i>
        <span>{{ growth }}</span>
      </div>
    </div>

    <!-- ✅ ADD: Show More button if text is long -->
    <button v-if="isLongText" @click="toggleExpand" class="expand-btn">
      {{ isExpanded ? "Show Less" : "Read More" }}
      <i
        :class="isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"
      ></i>
    </button>

    <div v-if="description" class="metric-description">
      {{ description }}
    </div>

    <div v-if="hasDetails" class="metric-details">
      <div v-if="details.partnerships" class="detail-item">
        <i class="ri-links-line"></i>
        <span>{{ details.partnerships }}</span>
      </div>
      <div v-if="details.awards" class="detail-item">
        <i class="ri-award-line"></i>
        <span>{{ details.awards }}</span>
      </div>
      <div v-if="details.media" class="detail-item">
        <i class="ri-newspaper-line"></i>
        <span>{{ details.media }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

interface Props {
  title: string;
  value: string;
  icon: string;
  iconColor?: string;
  iconBg?: string;
  metricType?:
    | "customers"
    | "revenue"
    | "users"
    | "growth"
    | "partnerships"
    | "awards"
    | "default";
  growth?: string;
  badge?: string;
  description?: string;
  details?: {
    partnerships?: string;
    awards?: string;
    media?: string;
  };
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: "#00d4ff",
  iconBg: "rgba(0, 212, 255, 0.1)",
  metricType: "default",
  details: () => ({}),
});

// ✅ ADD: Track expansion state
const isExpanded = ref(false);

// ✅ ADD: Check if text is long (more than 200 chars)
const isLongText = computed(() => {
  return displayValue.value.length > 200;
});

// ✅ ADD: Toggle function
function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

const displayValue = computed(() => {
  if (
    props.value === "Not mentioned in document" ||
    props.value === "Not specified in document"
  ) {
    return "Not specified";
  }
  return props.value;
});

const hasDetails = computed(() => {
  return (
    props.details &&
    (props.details.partnerships || props.details.awards || props.details.media)
  );
});

const growthClass = computed(() => {
  if (!props.growth) return "";
  const growthLower = props.growth.toLowerCase();
  if (
    growthLower.includes("grew") ||
    growthLower.includes("up") ||
    growthLower.includes("increase")
  ) {
    return "positive";
  }
  if (growthLower.includes("down") || growthLower.includes("decrease")) {
    return "negative";
  }
  return "neutral";
});

const growthIcon = computed(() => {
  const cls = growthClass.value;
  if (cls === "positive") return "ri-arrow-up-line";
  if (cls === "negative") return "ri-arrow-down-line";
  return "ri-subtract-line";
});
</script>

<style lang="scss" scoped>
$color-accent: #00d4ff;
$color-success: #22c55e;
$color-warning: #f59e0b;
$color-error: #ef4444;

.traction-metric-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba($color-accent, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  &.customers {
    border-top: 3px solid #22c55e;
  }

  &.revenue {
    border-top: 3px solid #00d4ff;
  }

  &.users {
    border-top: 3px solid #a855f7;
  }

  &.growth {
    border-top: 3px solid #f59e0b;
  }

  &.partnerships,
  &.awards {
    border-top: 3px solid #3b82f6;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 20px;
  }
}

.header-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.metric-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.metric-badge {
  padding: 4px 8px;
  background: rgba($color-accent, 0.2);
  color: $color-accent;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.metric-value-section {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.primary-value {
  font-size: 13px; // ✅ Smaller font
  font-weight: 600;
  color: #ffffff;
  line-height: 1.5;
  word-break: break-word;
  overflow-wrap: break-word;
  transition: all 0.3s ease;

  // ✅ Collapsed state - show 3 lines with ellipsis
  &.collapsed {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  // ✅ Expanded state - show all text
  &.expanded {
    display: block;
    white-space: normal;
  }
}

// ✅ ADD: Expand button styles
.expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.2);
  color: #00d4ff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 8px 0;

  &:hover {
    background: rgba(0, 212, 255, 0.2);
    border-color: rgba(0, 212, 255, 0.4);
    transform: translateY(-1px);
  }

  i {
    font-size: 14px;
    transition: transform 0.3s ease;
  }

  &:active {
    transform: translateY(0);
  }
}

.growth-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 6px;
  border-radius: 4px;
  flex-shrink: 0;

  &.positive {
    color: $color-success;
    background: rgba($color-success, 0.1);
  }

  &.negative {
    color: $color-error;
    background: rgba($color-error, 0.1);
  }

  &.neutral {
    color: $color-warning;
    background: rgba($color-warning, 0.1);
  }

  i {
    font-size: 12px;
  }
}

.metric-description {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 10px;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
}

.metric-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;

  i {
    color: $color-accent;
    font-size: 13px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  span {
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal;
    flex: 1;
  }
}

@media (max-width: 768px) {
  .traction-metric-card {
    padding: 16px;
  }

  .primary-value {
    font-size: 13px;
  }

  .metric-value-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .expand-btn {
    font-size: 10px;
    padding: 5px 10px;
  }
}
</style>
