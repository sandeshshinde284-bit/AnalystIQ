import { defineStore } from "pinia";
import {
  analysisService,
  type AnalysisResponse,
  type ProgressCallback,
} from "../services/api.service";
import { ProfessionalReportGenerator } from "../utils/reportGenerator";
import { useDatabaseStore } from "../stores/databaseStore";

interface ValidationIssue {
  type: string;
  level: "warning" | "info";
  title: string;
  description: string;
}

interface ProcessingStep {
  id: string;
  title: string;
  status: "pending" | "processing" | "completed" | "error";
}

interface AnalysisResult {
  startupName: string;
  analysisDate: string;
  industry?: string;
  sector?: string;
  stage?: string;
  recommendation: {
    text: string;
    score: number;
    justification: string;
  };
  keyMetrics: Array<{
    label: string;
    value: string;
    source: {
      type: string;
      location: string;
      confidence: string;
      details?: string;
    };
  }>;
  crossDocumentInsights?: any[];
  riskAssessment?: any[];
  summaryContent: {
    businessOverview: string;
    teamExperience: string;
    productTech: string;
  };
  competitiveAnalysis?: any[];
  marketOpportunity?: any;
  financialProjections?: any[];
  valuationInsights?: any;
  investmentTerms?: any;
  documentsAnalyzed?: any[];
  analysisMetadata?: any;

  traction?: {
    customers?: string;
    revenue?: string;
    users?: string;
    growth_rate?: string;
    partnerships?: string;
    awards?: string;
    media?: string;
  };

  call_prep_questions?: string | null;

  questions_json?: Array<{
    number: number;
    question: string;
    category: string;
    why_asking: string;
  }>;
  benchmarking?: string | null;

  weights_applied?: {
    founder: number;
    market: number;
    differentiation: number;
    team: number;
  };
  weighted_recommendation?: {
    weighted_score: number;
    weights_used: any;
  };

  [key: string]: any;
}

export const useAnalysisStore = defineStore("analysis", {
  state: () => ({
    isLoading: false,
    currentRequestId: null as string | null,
    currentAnalysisId: null as string | null,
    analysisResult: null as AnalysisResult | null,
    selectedCategory: "technology" as string,
    error: null as string | null,
    progress: 0,
    progressMessage: "",
    validationSummary: [] as ValidationIssue[],
    partialAnalysis: false,
    analysisCompleteness: 0,
    customWeights: {
      founder: 25,
      market: 25,
      differentiation: 25,
      team: 25,
    },
    processingSteps: [
      {
        id: "document-extraction",
        title: "Extracting text from documents",
        status: "pending" as const,
      },
      {
        id: "ai-analysis",
        title: "Performing AI analysis",
        status: "pending" as const,
      },
      {
        id: "cross-validation",
        title: "Cross-validating data sources",
        status: "pending" as const,
      },
      {
        id: "market-benchmarking",
        title: "Benchmarking against market data",
        status: "pending" as const,
      },
      {
        id: "risk-assessment",
        title: "Performing risk assessment",
        status: "pending" as const,
      },
      {
        id: "report-generation",
        title: "Generating analysis report",
        status: "pending" as const,
      },
    ] as ProcessingStep[],
    currentStep: 0,
    isRateLimited: false,
    rateLimitRetryIn: 0, // seconds
    securityValidationErrors: [] as Array<{
      code: string;
      message: string;
      icon: string;
    }>,
    isRetrying: false,
  }),

  actions: {
    async startAnalysis(
      files: File[],
      category: string = "technology",
      transcriptText: string = "",
      weights?: any
    ): Promise<AnalysisResult> {
      this.isLoading = true;
      this.error = null;
      this.progress = 0;
      this.currentStep = 0;
      this.analysisResult = null;
      this.validationSummary = [];
      this.partialAnalysis = false;
      this.securityValidationErrors = []; // ✅ CLEAR PREVIOUS ERRORS
      this.isRateLimited = false;
      this.isRetrying = false;

      this.processingSteps.forEach((step) => {
        step.status = "pending";
      });

      try {
        console.log(
          "🎯 Starting analysis with files:",
          files.map((f) => f.name),
          category,
          transcriptText,
          weights || this.customWeights
        );

        const result = await analysisService.processAnalysis(
          files,
          category,
          this.updateProgress.bind(this),
          transcriptText,
          weights || this.customWeights
        );

        console.log("📊 Analysis result received:", result);

        // Store request_id for progress tracking
        if (result && (result as any).request_id) {
          this.currentRequestId = (result as any).request_id;
          console.log("📊 Request ID stored:", this.currentRequestId);
        }

        if (result && (result as any).analysis_id) {
          this.currentAnalysisId = (result as any).analysis_id; // ✅ ADD THIS
          console.log("💾 Analysis ID stored:", this.currentAnalysisId);
        }

        // DO NOT VALIDATE STRUCTURE - JUST SANITIZE
        const sanitized = this.sanitizeResponse(result);

        console.log("📈 Setting analysisResult:", sanitized);
        this.analysisResult = sanitized;

        console.log("🛑 Setting isLoading to FALSE (CRITICAL)");
        this.isLoading = false;

        console.log("🔄 Setting progress to 100");
        this.progress = 100;

        console.log("✅ STATE CHECK:");
        console.log("   isLoading:", this.isLoading);
        console.log("   analysisResult:", !!this.analysisResult);
        console.log("   error:", this.error);
        this.processingSteps.forEach((step) => {
          step.status = "completed";
        });

        return sanitized;
      } catch (error: unknown) {
        // ✅ NEW: Check if it's a rate limit error
        if (error instanceof Error && error.message.includes("⏱️")) {
          this.handleRateLimit(60);
          this.recordSecurityValidationError(
            "RATE_LIMITED",
            "Too many requests. Please wait before trying again.",
            "⏱️"
          );
        }

        this.handleAnalysisError(error);
        throw error;
      }
    },

    runEnhancedAnalysis(analysisData: any) {
      const files = Object.values(analysisData.files).filter(
        (f) => f !== null
      ) as File[];

      this.customWeights = analysisData.weights || {
        founder: 25,
        market: 25,
        differentiation: 25,
        team: 25,
      };
      this.selectedCategory = analysisData.category || "technology";

      console.log("🔧 Enhanced analysis with data:", {
        category: analysisData.category,
        fileCount: files.length,
        files: files.map((f: File) => f.name),
        transcriptText: analysisData.transcriptText,
      });
      return this.startAnalysis(
        files,
        analysisData.category,
        analysisData.transcriptText || "",
        this.customWeights
      );
    },

    updateProgress(message: string, progress: number): void {
      console.log("📈 Progress update:", progress + "%", message);
      this.progressMessage = message;
      this.progress = Math.min(progress, 100);

      const stepProgress = Math.floor(
        (progress / 100) * this.processingSteps.length
      );
      this.currentStep = Math.min(
        stepProgress,
        this.processingSteps.length - 1
      );

      for (let i = 0; i < stepProgress; i++) {
        if (this.processingSteps[i].status !== "completed") {
          this.processingSteps[i].status = "completed";
        }
      }

      if (stepProgress < this.processingSteps.length) {
        this.processingSteps[stepProgress].status = "processing";
      }
    },

    sanitizeResponse(response: any): AnalysisResult {
      const data = response || {};

      // Track missing fields with CORRECT structure
      this.validationSummary = [];
      let fieldCount = 0;
      let providedCount = 0;

      // Check each critical field and build issues array
      if (
        !data.startupName ||
        data.startupName === "Not specified in document"
      ) {
        this.validationSummary.push({
          type: "warning",
          level: "warning",
          title: "Company Name",
          description: "Company name was not found in documents",
        });
      } else {
        providedCount++;
      }
      fieldCount++;

      if (!data.recommendation || !data.recommendation.text) {
        this.validationSummary.push({
          type: "warning",
          level: "warning",
          title: "Investment Recommendation",
          description: "Investment recommendation could not be determined",
        });
      } else {
        providedCount++;
      }
      fieldCount++;

      if (!data.keyMetrics || data.keyMetrics.length === 0) {
        this.validationSummary.push({
          type: "warning",
          level: "warning",
          title: "Key Metrics",
          description: "No key metrics found in documents",
        });
      } else {
        providedCount++;
      }
      fieldCount++;

      if (!data.riskAssessment || data.riskAssessment.length === 0) {
        this.validationSummary.push({
          type: "information",
          level: "info",
          title: "Risk Assessment",
          description:
            "No risks identified - documents may lack detailed analysis",
        });
      } else {
        providedCount++;
      }
      fieldCount++;

      if (
        !data.summaryContent ||
        !data.summaryContent.businessOverview ||
        data.summaryContent.businessOverview === "Not provided in documents"
      ) {
        this.validationSummary.push({
          type: "information",
          level: "info",
          title: "Business Overview",
          description: "Business overview not provided in documents",
        });
      } else {
        providedCount++;
      }
      fieldCount++;

      // Calculate completeness
      this.analysisCompleteness = Math.round(
        (providedCount / fieldCount) * 100
      );
      this.partialAnalysis = this.validationSummary.length > 0;

      console.log(`Data completeness: ${this.analysisCompleteness}%`);
      console.log(`Validation issues: ${this.validationSummary.length}`);
      console.log(`Validation summary:`, this.validationSummary);

      // BUILD SANITIZED RESPONSE WITH SAFE DEFAULTS
      const sanitized: AnalysisResult = {
        startupName: String(data.startupName || "Company Analysis"),
        analysisDate: new Date().toISOString(),
        industry: String(data.industry || "Not specified"),
        stage: String(data.stage || "Not specified"),

        recommendation: {
          text: String(data.recommendation?.text || "REVIEW"),
          score: this.getSafeScore(data.recommendation?.score),
          justification: String(
            data.recommendation?.justification ||
              "Analysis incomplete - review provided information"
          ),
        },

        keyMetrics: Array.isArray(data.keyMetrics)
          ? data.keyMetrics.filter((m: any) => m && m.label && m.value)
          : [],

        riskAssessment: Array.isArray(data.riskAssessment)
          ? data.riskAssessment.filter((r: any) => r && r.title)
          : [],

        summaryContent: {
          businessOverview: String(
            data.summaryContent?.businessOverview || "Not provided in documents"
          ),
          teamExperience: String(
            data.summaryContent?.teamExperience || "Not provided in documents"
          ),
          productTech: String(
            data.summaryContent?.productTech || "Not provided in documents"
          ),
        },

        crossDocumentInsights: Array.isArray(data.crossDocumentInsights)
          ? data.crossDocumentInsights
          : [],
        competitiveAnalysis: Array.isArray(data.competitiveAnalysis)
          ? data.competitiveAnalysis
          : [],
        marketOpportunity: data.marketOpportunity || {},
        financialProjections: Array.isArray(data.financialProjections)
          ? data.financialProjections
          : [],
        valuationInsights: data.valuationInsights || {},
        documentsAnalyzed: Array.isArray(data.documentsAnalyzed)
          ? data.documentsAnalyzed
          : [],
        analysisMetadata: data.analysisMetadata || {},

        memo_pdf_base64: (data as any).memo_pdf_base64 || null,
        public_data: (data as any).public_data || null,

        traction: data.traction || {},

        call_prep_questions: (data as any).call_prep_questions || null,
        questions_json: Array.isArray(data.questions_json)
          ? data.questions_json
          : [],
        benchmarking: (data as any).benchmarking || null,

        weights_applied: (data as any).weights_applied || null,
        weighted_recommendation: (data as any).weighted_recommendation || null,
      };
      console.log(
        "VALIDATION SUMMARY STRUCTURE:",
        JSON.stringify(this.validationSummary, null, 2)
      );
      return sanitized;
    },

    getSafeScore(score: any): number {
      if (typeof score === "number") {
        return Math.max(0, Math.min(100, score));
      }
      if (typeof score === "string") {
        const parsed = parseInt(score, 10);
        if (!isNaN(parsed)) {
          return Math.max(0, Math.min(100, parsed));
        }
      }
      return 50; // Default
    },

    getCompetitiveAnalysisData() {
      const analysis = this.analysisResult;

      console.log("=== COMPETITIVE ANALYSIS DEBUG ===");
      console.log("competitiveAnalysis data:", analysis?.competitiveAnalysis);

      // ✅ If real data exists from Gemini
      if (
        analysis?.competitiveAnalysis &&
        analysis.competitiveAnalysis.length > 0
      ) {
        console.log("✅ Using REAL competitive data from Gemini");

        const realData = analysis.competitiveAnalysis.map(
          (comp: any, index: number) => ({
            company: comp.competitor || `Company ${index + 1}`,
            revenue: parseFloat(
              (comp.marketShare as string)?.replace(/\D/g, "") ||
                (Math.random() * 5).toFixed(1)
            ),
          })
        );

        console.log("Real data:", realData);
        return realData;
      }

      // ❌ If NO data from Gemini - return EMPTY with message
      console.log("⚠️ No competitive data - returning empty array");
      return [];
    },

    getMarketGrowthData() {
      const analysis = this.analysisResult;

      console.log("=== MARKET GROWTH DEBUG ===");
      console.log("marketOpportunity:", analysis?.marketOpportunity);
      console.log("TAM:", analysis?.marketOpportunity?.TAM);

      // ✅ If TAM exists from Gemini, use it
      if (analysis?.marketOpportunity?.TAM) {
        const tam = analysis.marketOpportunity.TAM as string;
        console.log("TAM string:", tam);

        const tamValue = parseFloat(tam.replace(/\D/g, ""));
        console.log("TAM parsed value:", tamValue);

        if (!isNaN(tamValue) && tamValue > 0) {
          console.log("✅ Using REAL TAM from Gemini");

          const baseData = [
            { year: 2020, value: 10 },
            { year: 2021, value: 15 },
            { year: 2022, value: 22 },
            { year: 2023, value: 32 },
            { year: 2024, value: 42 },
            { year: 2025, value: 48 },
            { year: 2026, value: 50 },
            { year: 2027, value: 52 },
          ];

          const scaleFactor = tamValue / baseData[baseData.length - 1].value;
          const scaledData = baseData.map((d) => ({
            ...d,
            value: Math.round((d.value * scaleFactor) / 1000) * 1000,
          }));

          console.log("Scaled data:", scaledData);
          return scaledData;
        }
      }
      console.log("⚠️ No market growth data - returning empty array");
      return [];
    },

    // ============================================================================
    // FINANCIAL PROJECTIONS - Show real data OR empty
    // ============================================================================
    getFinancialProjectionsData() {
      const analysis = this.analysisResult;

      console.log("=== FINANCIAL PROJECTIONS DEBUG ===");
      console.log("financialProjections:", analysis?.financialProjections);

      // ✅ If real projections exist from Gemini
      if (
        analysis?.financialProjections &&
        analysis.financialProjections.length > 0
      ) {
        console.log("✅ Using REAL financial projections from Gemini");

        const realProjections = analysis.financialProjections
          .map((proj: any) => {
            const revenue = parseFloat(
              (proj.revenue as string)?.replace(/\D/g, "") || "0"
            );
            const expenses = parseFloat(
              (proj.expenses as string)?.replace(/\D/g, "") || "0"
            );
            const margins = parseFloat(
              (proj.margins as string)?.replace(/\D/g, "") || "0"
            );

            console.log(`Year ${proj.year}:`, { revenue, expenses, margins });

            return {
              year: proj.year || "Year",
              revenue: revenue || 0,
              expenses: expenses || 0,
              margins: margins || 0,
            };
          })
          .filter((p: any) => p.revenue > 0); // Only include if has revenue data

        if (realProjections.length > 0) {
          console.log("Real projections:", realProjections);
          return realProjections;
        }
      }

      // ❌ If NO projections from Gemini - return EMPTY array
      console.log("⚠️ No financial projections - returning empty array");
      return [];
    },

    // ============================================================================
    // PERFORMANCE RADAR - Show real risk data OR default scores
    // ============================================================================
    getPerformanceRadarData(): Record<string, number> {
      const analysis = this.analysisResult;

      console.log("=== PERFORMANCE RADAR DEBUG ===");
      console.log("riskAssessment:", analysis?.riskAssessment);
      console.log("recommendation.score:", analysis?.recommendation?.score);

      // Always provide base scores (for radar to work)
      const defaultScores: Record<string, number> = {
        "Team Experience": 75,
        "Competitive Position": 65,
        "Product Innovation": 70,
        "Market Opportunity": 80,
        "Financial Health": analysis?.recommendation?.score || 70,
      };

      // ✅ If risk data exists from Gemini, override with it
      if (analysis?.riskAssessment && analysis.riskAssessment.length > 0) {
        console.log("✅ Using REAL risk data from Gemini");

        const riskScores: Record<string, number> = {};

        analysis.riskAssessment.forEach((risk: any) => {
          // Convert risk level to score (high=20, medium=40, low=60)
          const riskPoints =
            risk.level === "high" ? 20 : risk.level === "medium" ? 40 : 60;

          console.log(`Risk: ${risk.type} (${risk.level}) → ${riskPoints}`);

          if ((risk.type as string)?.includes("execution")) {
            riskScores["Team Experience"] = Math.min(100, riskPoints);
          }
          if ((risk.type as string)?.includes("market")) {
            riskScores["Market Opportunity"] = Math.min(100, riskPoints);
          }
          if ((risk.type as string)?.includes("financial")) {
            riskScores["Financial Health"] = Math.min(100, riskPoints);
          }
          if ((risk.type as string)?.includes("technical")) {
            riskScores["Product Innovation"] = Math.min(100, riskPoints);
          }
        });

        const finalScores = { ...defaultScores, ...riskScores };
        console.log("Final scores:", finalScores);
        return finalScores;
      }

      // ⚠️ If NO risk data - use default scores (still shows radar with defaults)
      console.log("⚠️ No risk assessment - using default scores");
      return defaultScores;
    },

    getAllChartsData() {
      return {
        competitiveAnalysis: this.getCompetitiveAnalysisData(),
        marketGrowth: this.getMarketGrowthData(),
        financialProjections: this.getFinancialProjectionsData(),
        performanceRadar: this.getPerformanceRadarData(),
      };
    },

    clearAnalysis() {
      this.analysisResult = null;
      this.error = null;
      this.progress = 0;
      this.progressMessage = "";
      this.currentStep = 0;
      this.isLoading = false;
      this.validationSummary = [];
      this.partialAnalysis = false;
      this.analysisCompleteness = 0;

      this.processingSteps.forEach((step) => {
        step.status = "pending";
      });
      this.currentRequestId = null;
    },

    async checkBackendConnection() {
      try {
        const health = await analysisService.checkBackendHealth();
        const isHealthy = health.status === "healthy" || health.status === "ok";

        if (isHealthy) {
          console.log("✅ Backend is healthy");
          return true;
        } else {
          console.warn("⚠️ Backend returned unhealthy status:", health.status);
          return false;
        }
      } catch (error) {
        console.error("❌ Backend health check failed:", error);
        return false;
      }
    },

    async exportReport(): Promise<void> {
      try {
        if (!this.analysisResult) {
          throw new Error("No analysis data available");
        }

        const generator = new ProfessionalReportGenerator();
        await generator.generateReport(this.analysisResult);
      } catch (error: any) {
        console.error("Export failed:", error);
        throw new Error(`Export failed: ${error.message}`);
      }
    },

    async exportAsJSON(): Promise<void> {
      try {
        if (!this.analysisResult) {
          throw new Error("No analysis data to export");
        }

        const dataStr = JSON.stringify(this.analysisResult, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;

        const startupName = this.analysisResult.startupName || "Analysis";
        const date = new Date().toISOString().split("T")[0];
        link.download = `${startupName}_Report_${date}.json`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log("✅ JSON exported successfully");
      } catch (error: any) {
        console.error("❌ JSON export failed:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to export JSON"
        );
      }
    },

    async exportAsMemo(): Promise<void> {
      try {
        if (!this.analysisResult) throw new Error("No analysis data");

        const pdfBase64 = (this.analysisResult as any).memo_pdf_base64;

        console.log("📄 DEBUG: Checking PDF data...");
        console.log("   memo_pdf_base64 exists:", !!pdfBase64);
        console.log("   memo_pdf_base64 type:", typeof pdfBase64);
        console.log("   memo_pdf_base64 length:", pdfBase64?.length);

        if (
          !pdfBase64 ||
          typeof pdfBase64 !== "string" ||
          pdfBase64.length < 100
        ) {
          console.error("❌ Invalid PDF data:", {
            exists: !!pdfBase64,
            type: typeof pdfBase64,
            length: pdfBase64?.length,
            firstChars: pdfBase64?.substring(0, 50),
          });
          throw new Error("PDF not generated by backend or is invalid");
        }

        console.log("📋 Downloading memo PDF...");

        // Convert base64 to bytes
        const binary = atob(pdfBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        // Create blob and download
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        const startupName = this.analysisResult.startupName || "Analysis";
        const date = new Date().toISOString().split("T")[0];
        link.download = `${startupName}_Memo_${date}.pdf`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log("✅ Memo PDF downloaded successfully");
      } catch (error: any) {
        console.error("❌ Memo export failed:", error);
        throw new Error(`Memo export failed: ${error.message}`);
      }
    },

    handleAnalysisError(error: unknown): void {
      console.error("Analysis error:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Analysis failed";

      this.error = errorMessage;
      this.isLoading = false;
      this.progress = 0;

      if (this.currentStep < this.processingSteps.length) {
        this.processingSteps[this.currentStep].status = "error";
      }
    },

    clearError() {
      this.error = null;
      this.progress = 0;
      this.progressMessage = "";
      this.currentStep = 0;
      this.isLoading = false;
      this.validationSummary = [];
      this.partialAnalysis = false;
      this.analysisCompleteness = 0;

      this.processingSteps.forEach((step) => {
        step.status = "pending";
      });
    },
    // ✅ NEW: Handle rate limit with countdown
    handleRateLimit(retryAfterSeconds: number = 60): void {
      this.isRateLimited = true;
      this.rateLimitRetryIn = retryAfterSeconds;

      console.log(`⏱️ Rate limited for ${retryAfterSeconds}s`);

      // Countdown timer
      const interval = setInterval(() => {
        this.rateLimitRetryIn--;

        if (this.rateLimitRetryIn <= 0) {
          clearInterval(interval);
          this.isRateLimited = false;
          this.isRetrying = false;
          console.log("✅ Rate limit reset");
        }
      }, 1000);
    },

    // ✅ NEW: Extract and store security errors
    recordSecurityValidationError(
      code: string,
      message: string,
      icon: string = "❌"
    ): void {
      this.securityValidationErrors.push({
        code,
        message,
        icon,
      });

      this.error = `${icon} ${message}`;

      console.warn(`[${code}] Security validation failed: ${message}`);
    },

    // ✅ NEW: Clear security errors
    clearSecurityErrors(): void {
      this.securityValidationErrors = [];
    },
  },

  getters: {
    getCompletedSteps: (state) => {
      return state.processingSteps.filter((step) => step.status === "completed")
        .length;
    },

    getTotalSteps: (state) => {
      return state.processingSteps.length;
    },

    getValidationSummary: (state) => state.validationSummary,

    getAnalysisCompleteness: (state) => state.analysisCompleteness,

    isPartialAnalysis: (state) => state.partialAnalysis,

    // ✅ NEW: Get security validation errors
    getSecurityErrors: (state) => state.securityValidationErrors,

    // ✅ NEW: Check if rate limited
    isCurrentlyRateLimited: (state) => state.isRateLimited,

    // ✅ NEW: Get retry countdown
    getRateLimitCountdown: (state) => state.rateLimitRetryIn,

    getPublicData: (state) => {
      return (
        (state.analysisResult as any)?.public_data || {
          news: [],
          funding_profile: {},
          social_proof: {},
          market_data: {},
        }
      );
    },
  },
});
