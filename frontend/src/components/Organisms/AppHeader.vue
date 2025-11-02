<!-- File: src/components/Organisms/AppHeader.vue -->
<template>
  <header class="app-header">
    <div class="container">
      <!-- Left: Logo -->
      <router-link to="/" class="logo">
        <i class="ri-line-chart-fill logo-icon"></i>
        <span>AnalystIQ</span>
      </router-link>

      <!-- Spacer -->
      <div class="spacer"></div>

      <!-- Right: User Section & Actions -->
      <div class="nav-right">
        <!-- New Analysis Button -->
        <router-link to="/app/new-analysis" class="new-analysis-btn">
          <i class="ri-add-circle-line"></i>
          New Analysis
        </router-link>
        <router-link to="/app/my-analyses" class="new-analysis-btn">
          <i class="ri-history-line"></i>
          My Analyses
        </router-link>
        <!-- User Info -->
        <div class="user-info">
          <span class="user-email">{{ userEmail }}</span>
        </div>

        <!-- Logout Button -->
        <button
          class="logout-btn"
          @click="handleLogout"
          :disabled="isLoading"
          title="Logout"
        >
          <i
            :class="
              isLoading ? 'ri-loader-line spinning' : 'ri-logout-box-r-line'
            "
          ></i>
          <span class="logout-text">Logout</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const authStore = useAuthStore();

const userEmail = computed(() => authStore.getUserEmail);
const isLoading = computed(() => authStore.isLoading);

async function handleLogout() {
  try {
    console.log("🔐 Attempting logout...");
    await authStore.logout();
    console.log("✅ Logout successful");
    router.push("/");
  } catch (error) {
    console.error("❌ Logout failed:", error);
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/global.scss";

.app-header {
  background-color: rgba($color-background, 0.8);
  border-bottom: 1px solid $color-border;
  padding: 14px 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 30px;
  gap: 24px;

  @media (max-width: 768px) {
    padding: 0 20px;
    gap: 16px;
  }
}

// ============== LOGO ==============
.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  font-size: 24px;
  font-weight: bold;
  color: $color-text-primary;
  white-space: nowrap;
  transition: transform 0.3s ease;
  flex-shrink: 0;

  &:hover {
    transform: scale(1.05);
  }

  .logo-icon {
    color: $color-accent;
    font-size: 28px;
    margin-right: 8px;
  }

  span {
    background: linear-gradient(90deg, $color-text-primary, $color-accent);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
}

// ============== SPACER ==============
.spacer {
  flex: 1;

  @media (max-width: 768px) {
    display: none;
  }
}

// ============== RIGHT SECTION ==============
.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    gap: 8px;
  }
}

// ============== NEW ANALYSIS BUTTON ==============
.new-analysis-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, $color-accent, #00ffff);
  color: #000000;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  box-shadow: 0 2px 12px rgba($color-accent, 0.2);

  &:hover {
    box-shadow: 0 4px 20px rgba($color-accent, 0.4);
    transform: translateY(-2px);
  }

  i {
    font-size: 16px;
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 12px;

    .text {
      display: none;
    }

    i {
      font-size: 18px;
      margin: 0;
    }
  }
}

// ============== USER INFO ==============
.user-info {
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-left: 1px solid rgba($color-accent, 0.2);
  border-right: 1px solid rgba($color-accent, 0.2);

  @media (max-width: 1024px) {
    display: none;
  }
}

.user-email {
  font-size: 13px;
  color: $color-text-secondary;
  font-weight: 500;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ============== LOGOUT BUTTON ==============
.logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  i {
    font-size: 16px;

    &.spinning {
      animation: spin 1s linear infinite;
    }
  }

  .logout-text {
    @media (max-width: 768px) {
      display: none;
    }
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 0;

    i {
      font-size: 18px;
      margin: 0;
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
