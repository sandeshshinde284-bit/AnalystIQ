import { defineStore } from "pinia";
import {
  analysisService,
  type AnalysisResponse,
  type ProgressCallback,
} from "../services/api.service";
import { ProfessionalReportGenerator } from "../utils/reportGenerator";

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
  [key: string]: any;
}

export const useAnalysisStore = defineStore("analysis", {
  state: () => ({
    isLoading: false,
    analysisResult: null as AnalysisResult | null,
    selectedCategory: "technology" as string,
    error: null as string | null,
    progress: 0,
    progressMessage: "",
    validationSummary: [] as ValidationIssue[],
    partialAnalysis: false,
    analysisCompleteness: 0,
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
  }),

  actions: {
    async startAnalysis(
      files: File[],
      category: string = "technology"
    ): Promise<AnalysisResult> {
      this.isLoading = true;
      this.error = null;
      this.progress = 0;
      this.currentStep = 0;
      this.analysisResult = null;
      this.validationSummary = [];
      this.partialAnalysis = false;

      this.processingSteps.forEach((step) => {
        step.status = "pending";
      });

      try {
        console.log(
          "🎯 Starting analysis with files:",
          files.map((f) => f.name),
          category
        );

        const result = await analysisService.processAnalysis(
          files,
          category,
          this.updateProgress.bind(this)
        );

        console.log("📊 Analysis result received:", result);

        // DO NOT VALIDATE STRUCTURE - JUST SANITIZE
        const sanitized = this.sanitizeResponse(result);

        this.analysisResult = sanitized;
        this.isLoading = false;
        this.progress = 100;

        this.processingSteps.forEach((step) => {
          step.status = "completed";
        });

        return sanitized;
      } catch (error: unknown) {
        this.handleAnalysisError(error);
        throw error;
      }
    },

    runEnhancedAnalysis(analysisData: any) {
      const files = Object.values(analysisData.files).filter(
        (f) => f !== null
      ) as File[];

      this.selectedCategory = analysisData.category || "technology";

      console.log("🔧 Enhanced analysis with data:", {
        category: analysisData.category,
        fileCount: files.length,
        files: files.map((f: File) => f.name),
      });
      return this.startAnalysis(files, analysisData.category);
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

      if (
        !analysis?.competitiveAnalysis ||
        analysis.competitiveAnalysis.length === 0
      ) {
        return [
          { company: "Target Company", revenue: 1.5 },
          { company: "Competitor A", revenue: 2.0 },
          { company: "Competitor B", revenue: 2.8 },
          { company: "Competitor C", revenue: 1.8 },
          { company: "Market Leader", revenue: 5.0 },
        ];
      }

      return analysis.competitiveAnalysis.map((comp: any, index: number) => ({
        company: comp.competitor || `Competitor ${index + 1}`,
        revenue: parseFloat(
          (comp.marketShare as string)?.replace(/\D/g, "") ||
            (2 + Math.random() * 3).toFixed(1)
        ),
      }));
    },

    getMarketGrowthData() {
      const analysis = this.analysisResult;

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

      if (analysis?.marketOpportunity?.TAM) {
        const tam = analysis.marketOpportunity.TAM as string;
        const tamValue = parseFloat(tam.replace(/\D/g, ""));

        if (!isNaN(tamValue)) {
          const scaleFactor = tamValue / baseData[baseData.length - 1].value;
          return baseData.map((d) => ({
            ...d,
            value: Math.round((d.value * scaleFactor) / 1000) * 1000,
          }));
        }
      }

      return baseData;
    },

    getFinancialProjectionsData() {
      const analysis = this.analysisResult;

      if (
        analysis?.financialProjections &&
        analysis.financialProjections.length > 0
      ) {
        return analysis.financialProjections.map((proj: any) => ({
          year: proj.year || "Year",
          revenue: parseFloat(
            (proj.revenue as string)?.replace(/\D/g, "") || "0"
          ),
          expenses: parseFloat(
            (proj.expenses as string)?.replace(/\D/g, "") || "0"
          ),
          margins: parseFloat(
            (proj.margins as string)?.replace(/\D/g, "") || "0"
          ),
        }));
      }

      const projections: any[] = [];
      let baseRevenue = 100;

      for (let year = 2025; year <= 2029; year++) {
        const revenue = Math.round(baseRevenue * Math.pow(1.6, year - 2025));
        const expenses = Math.round(revenue * 0.6);
        const margin = Math.round(((revenue - expenses) / revenue) * 100);

        projections.push({
          year: year.toString(),
          revenue,
          expenses,
          margins: margin,
        });
      }

      return projections;
    },

    getPerformanceRadarData(): Record<string, number> {
      const analysis = this.analysisResult;

      const defaultScores: Record<string, number> = {
        "Team Experience": 75,
        "Competitive Position": 65,
        "Product Innovation": 70,
        "Market Opportunity": 80,
        "Financial Health": analysis?.recommendation?.score || 70,
      };

      if (analysis?.riskAssessment && analysis.riskAssessment.length > 0) {
        const riskScores: Record<string, number> = {};

        analysis.riskAssessment.forEach((risk: any) => {
          const riskPoints =
            risk.level === "high" ? 20 : risk.level === "medium" ? 40 : 60;

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

        return { ...defaultScores, ...riskScores };
      }

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
  },
});
