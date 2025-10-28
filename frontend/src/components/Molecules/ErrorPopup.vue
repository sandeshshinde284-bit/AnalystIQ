<template>
  <teleport to="body">
    <transition name="fade">
      <div
        v-if="isVisible"
        class="error-popup-overlay"
        @click.self="closePopup"
      >
        <div class="error-popup-container" :class="`error-type-${errorType}`">
          <!-- Close Button -->
          <button class="close-btn" @click="closePopup">
            <i class="ri-close-line"></i>
          </button>

          <!-- Icon -->
          <div class="popup-icon">
            <i :class="iconClass"></i>
          </div>

          <!-- Title -->
          <h2 class="popup-title">{{ title }}</h2>

          <!-- Message -->
          <div class="popup-message">
            <p v-for="(line, idx) in messageLines" :key="idx">
              {{ line }}
            </p>
          </div>

          <!-- Suggestions -->
          <div v-if="suggestions.length > 0" class="suggestions-section">
            <h3>✅ Please Upload:</h3>
            <ul class="suggestions-list">
              <li v-for="(suggestion, idx) in suggestions" :key="idx">
                {{ suggestion }}
              </li>
            </ul>
          </div>

          <!-- Action Buttons -->
          <div class="popup-actions">
            <button class="btn-primary" @click="closePopup">
              <i class="ri-check-line"></i>
              Got It, Let Me Try Again
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  isVisible: boolean;
  errorType?: "personal" | "non-business" | "insufficient" | "format" | "mixed";
  title?: string;
  message?: string;
  suggestions?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  errorType: "personal",
  title: "Document Validation Failed",
  message: "This document cannot be analyzed.",
  suggestions: () => [],
});

const emit = defineEmits<{
  close: [];
}>();

const isVisible = computed(() => props.isVisible);

const messageLines = computed(() => {
  if (!props.message) return [];
  return props.message.split("\n").filter((line) => line.trim());
});

const iconClass = computed(() => {
  const icons: Record<string, string> = {
    personal: "ri-shield-warning-line",
    "non-business": "ri-alert-line",
    insufficient: "ri-document-line",
    format: "ri-file-damage-line",
    mixed: "ri-forbid-line",
  };
  return icons[props.errorType] || "ri-error-warning-line";
});

function closePopup() {
  emit("close");
}
</script>

<style lang="scss" scoped>
.error-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.error-popup-container {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 40px 30px;
  max-width: 500px;
  width: 100%;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;

  &.error-type-personal {
    border-top: 4px solid #ef4444;
  }

  &.error-type-non-business {
    border-top: 4px solid #f59e0b;
  }

  &.error-type-insufficient {
    border-top: 4px solid #eab308;
  }

  &.error-type-format {
    border-top: 4px solid #06b6d4;
  }

  &.error-type-mixed {
    border-top: 4px solid #8b5cf6;
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
  cursor: pointer;
  transition: color 0.2s;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #ffffff;
  }
}

.popup-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;

  i {
    font-size: 32px;
    color: #ef4444;
  }
}

.popup-title {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 16px;
  text-align: center;
}

.popup-message {
  background: rgba(255, 255, 255, 0.03);
  border-left: 3px solid #00d4ff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;

  p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    line-height: 1.6;
    margin: 0 0 8px 0;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.suggestions-section {
  background: rgba(34, 197, 94, 0.05);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;

  h3 {
    font-size: 14px;
    font-weight: 600;
    color: #22c55e;
    margin: 0 0 12px 0;
  }

  .suggestions-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;

    li {
      color: rgba(255, 255, 255, 0.7);
      font-size: 13px;
      padding-left: 20px;
      position: relative;

      &::before {
        content: "✓";
        position: absolute;
        left: 0;
        color: #22c55e;
        font-weight: bold;
      }
    }
  }
}

.popup-actions {
  display: flex;
  gap: 12px;

  .btn-primary {
    flex: 1;
    padding: 14px 24px;
    background: linear-gradient(135deg, #00d4ff, #0099ff);
    border: none;
    border-radius: 8px;
    color: #ffffff;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 15px;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 212, 255, 0.3);
    }

    &:active {
      transform: translateY(0);
    }

    i {
      font-size: 18px;
    }
  }
}

// Animations
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Responsive
@media (max-width: 600px) {
  .error-popup-container {
    padding: 30px 20px;
    max-width: 90vw;
  }

  .popup-title {
    font-size: 18px;
  }

  .popup-message {
    font-size: 13px;
  }
}
</style>
