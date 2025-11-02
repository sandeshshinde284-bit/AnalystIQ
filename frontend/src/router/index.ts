//src-router - INDEX.TS

import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { useAnalysisStore } from "@/stores/analysisStore";
import { useAuthStore } from "@/stores/authStore";

// ✅ NEW: Route guard to protect analysis routes
// const requiresAnalysisData = (to: any, from: any, next: any) => {
//   const analysisStore = useAnalysisStore();

//   // If trying to access results/progress without data, redirect home
//   if (
//     !analysisStore.analysisResult &&
//     (to.name === "AnalysisResults" || to.name === "AnalysisInProgress")
//   ) {
//     console.warn("No analysis data - redirecting home");
//     next("/");
//   } else {
//     next();
//   }
// };

const requiresAnalysisData = (to: any, from: any, next: any) => {
  const analysisStore = useAnalysisStore();

  console.log("🔐 Route Guard Check for:", to.name);
  console.log("   isLoading:", analysisStore.isLoading);
  console.log("   hasResult:", !!analysisStore.analysisResult);

  // ✅ Allow if:
  // 1. Analysis is currently loading (user just clicked button)
  // 2. OR analysis result exists (backend completed)
  if (analysisStore.isLoading || analysisStore.analysisResult) {
    console.log("✅ Guard allowed - analysis in progress or complete");
    next();
  } else {
    console.warn("❌ Guard blocked - no analysis data. Redirecting home");
    next("/");
  }
};

const routes: Array<RouteRecordRaw> = [
  // Public Routes
  {
    path: "/",
    name: "Home",
    component: HomeView,
    meta: { title: "AnalystIQ - AI Investment Analysis" },
  },
  {
    path: "/about",
    name: "About",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/AboutView.vue"),
    meta: { title: "About - AnalystIQ" },
  },
  {
    path: "/login",
    name: "Login",
    component: () =>
      import(/* webpackChunkName: "login" */ "../views/LoginView.vue"),
    meta: { title: "Login - AnalystIQ" },
  },

  // Application Routes
  {
    path: "/app",
    redirect: "/app/new-analysis",
    children: [
      {
        path: "new-analysis",
        name: "NewAnalysis",
        component: () =>
          import(
            /* webpackChunkName: "new-analysis" */ "../views/NewAnalysisView.vue"
          ),
        meta: { title: "New Analysis - AnalystIQ", requiresAuth: true },
      },
      {
        path: "my-analyses",
        name: "MyAnalyses",
        component: () =>
          import(
            /* webpackChunkName: "my-analyses" */ "../views/MyAnalysesView.vue"
          ),
        meta: { title: "My Analyses - AnalystIQ", requiresAuth: true },
      },
      {
        path: "analysis-in-progress",
        name: "AnalysisInProgress",
        component: () =>
          import(
            /* webpackChunkName: "analysis-progress" */ "../views/AnalysisInProgressView.vue"
          ),
        meta: {
          title: "Analysis in Progress - AnalystIQ",
          requiresAuth: true,
        },
        beforeEnter: requiresAnalysisData,
      },
      {
        path: "analysis-results",
        name: "AnalysisResults",
        component: () =>
          import(
            /* webpackChunkName: "analysis-results" */ "../views/AnalysisResultsView.vue"
          ),
        meta: { title: "Analysis Results - AnalystIQ", requiresAuth: true },
        beforeEnter: requiresAnalysisData,
      },
    ],
  },

  // Catch all route - 404
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    redirect: "/",
  },
];

const router = createRouter({
  // ✅ FIXED: Using import.meta.env.BASE_URL for Vite projects
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Global navigation guard
router.beforeEach(async (to, from, next) => {
  // Set page title
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }

  // ✅ ADD: Check auth state
  const authStore = useAuthStore();

  // Initialize auth if not done
  if (!authStore.isAuthenticated && !authStore.user) {
    console.log("🔑 Checking auth state...");
    try {
      await authStore.initializeAuth();
    } catch (error) {
      console.error("❌ Auth initialization failed:", error);
    }
  }

  // ✅ If route requires auth and user not logged in, redirect to login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log("🔒 Route requires auth, redirecting to login");
    next({ name: "Login", query: { redirect: to.fullPath } });
  }
  // ✅ If user is logged in and tries to go to login, redirect to analysis
  else if (
    (to.name === "Login" || to.path === "/login") &&
    authStore.isAuthenticated
  ) {
    console.log("✅ User already logged in, redirecting to analysis");
    next({ name: "NewAnalysis" });
  }
  // ✅ Allow navigation
  else {
    next();
  }
});

export default router;
