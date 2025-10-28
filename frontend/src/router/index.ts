//src-router - INDEX.TS

import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { useAnalysisStore } from "@/stores/analysisStore";

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
        meta: { title: "New Analysis - AnalystIQ", requiresAuth: false },
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
          requiresAuth: false,
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
        meta: { title: "Analysis Results - AnalystIQ", requiresAuth: false },
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
router.beforeEach((to, from, next) => {
  // Set page title
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }

  // Check authentication if required
  if (to.meta.requiresAuth) {
    // Add authentication logic here
    // For now, allow all routes
    next();
  } else {
    next();
  }
});

export default router;
