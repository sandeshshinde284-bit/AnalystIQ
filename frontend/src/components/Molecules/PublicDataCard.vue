<template>
  <div class="public-data-card" :class="cardType">
    <div class="card-header">
      <div class="icon-badge" :style="{ background: iconBg }">
        <i :class="icon" :style="{ color: iconColor }"></i>
      </div>
      <div class="header-text">
        <h4>{{ title }}</h4>
        <span v-if="subtitle" class="subtitle">{{ subtitle }}</span>
      </div>
      <span v-if="badge" class="status-badge" :class="badgeClass">
        {{ badge }}
      </span>
    </div>

    <div class="card-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  title: string;
  subtitle?: string;
  icon: string;
  iconColor?: string;
  iconBg?: string;
  cardType?:
    | "news"
    | "funding"
    | "social"
    | "market"
    | "github"
    | "company"
    | "default";
  badge?: string;
  badgeType?: "verified" | "new" | "trending" | "active";
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: "#00d4ff",
  iconBg: "rgba(0, 212, 255, 0.1)",
  cardType: "default",
  badgeType: "verified",
});

const badgeClass = computed(() => {
  return `badge-${props.badgeType}`;
});
</script>

<style lang="scss" scoped>
$color-accent: #00d4ff;
$color-success: #22c55e;
$color-warning: #f59e0b;
$color-info: #3b82f6;

.public-data-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba($color-accent, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  &.news {
    border-top: 3px solid #3b82f6;
  }

  &.funding {
    border-top: 3px solid #22c55e;
  }

  &.social {
    border-top: 3px solid #a855f7;
  }

  &.market {
    border-top: 3px solid #f59e0b;
  }

  &.github {
    border-top: 3px solid #6366f1;
  }

  &.company {
    border-top: 3px solid #00d4ff;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.icon-badge {
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

.header-text {
  flex: 1;
  min-width: 0;

  h4 {
    margin: 0 0 2px 0;
    font-size: 15px;
    font-weight: 600;
    color: #ffffff;
  }

  .subtitle {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.badge-verified {
    background: rgba($color-success, 0.2);
    color: $color-success;
    border: 1px solid rgba($color-success, 0.3);
  }

  &.badge-new {
    background: rgba($color-info, 0.2);
    color: $color-info;
    border: 1px solid rgba($color-info, 0.3);
  }

  &.badge-trending {
    background: rgba($color-warning, 0.2);
    color: $color-warning;
    border: 1px solid rgba($color-warning, 0.3);
  }

  &.badge-active {
    background: rgba($color-accent, 0.2);
    color: $color-accent;
    border: 1px solid rgba($color-accent, 0.3);
  }
}

.card-content {
  padding: 16px;
}

@media (max-width: 768px) {
  .card-header {
    padding: 12px;
  }

  .icon-badge {
    width: 36px;
    height: 36px;

    i {
      font-size: 18px;
    }
  }

  .card-content {
    padding: 12px;
  }
}
</style>
