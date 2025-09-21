import { defineStore } from "pinia";
import {
  analysisService,
  type AnalysisResponse,
  type ProgressCallback,
} from "../services/api.service";

interface ProcessingStep {
  id: string;
  title: string;
  status: "pending" | "processing" | "completed" | "error";
}

// Define types locally to avoid import issues
interface AnalysisResult {
  startupName: string;
  analysisDate: string;
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
      details: string;
    };
  }>;
  crossDocumentInsights?: Array<{
    type: string;
    title: string;
    description: string;
    confidence: string;
    status: string;
    source?: {
      documents: string[];
    };
  }>;
  riskAssessment?: Array<{
    type: string;
    title: string;
    description: string;
    level: string;
    mitigation: string;
    impact: string;
  }>;
  summaryContent: {
    businessOverview: string;
    teamExperience: string;
    productTech: string;
  };
  documentsAnalyzed?: Array<{
    type: string;
    name: string;
  }>;
  analysisMetadata?: {
    documentsProcessed: number;
    analysisDepth: string;
    crossValidationPerformed: boolean;
    processingTime: string;
    confidenceBoost?: number;
  };
}

export const useAnalysisStore = defineStore("analysis", {
  state: () => ({
    isLoading: false,
    analysisResult: null as AnalysisResult | null,
    error: null as string | null,
    progress: 0,
    progressMessage: "",
    processingSteps: [
      {
        id: "document-extraction",
        title: "Extracting text from documents",
        status: "pending",
      },
      { id: "ai-analysis", title: "Performing AI analysis", status: "pending" },
      {
        id: "cross-validation",
        title: "Cross-validating data sources",
        status: "pending",
      },
      {
        id: "market-benchmarking",
        title: "Benchmarking against market data",
        status: "pending",
      },
      {
        id: "risk-assessment",
        title: "Performing risk assessment",
        status: "pending",
      },
      {
        id: "report-generation",
        title: "Generating analysis report",
        status: "pending",
      },
    ],
    currentStep: 0,
  }),

  actions: {
    async startAnalysis(files: File[]): Promise<AnalysisResult> {
      this.isLoading = true;
      this.error = null;
      this.progress = 0;
      this.currentStep = 0;
      this.analysisResult = null;

      // Reset all steps to pending
      this.processingSteps.forEach((step) => {
        step.status = "pending";
      });

      try {
        console.log(
          "🎯 Starting analysis with files:",
          files.map((f) => f.name)
        );

        const result = await analysisService.processAnalysis(
          files,
          this.updateProgress.bind(this)
        );

        console.log("📊 Analysis result received:", result);
        this.analysisResult = result;
        this.isLoading = false;
        this.progress = 100;

        // Mark all steps as completed
        this.processingSteps.forEach((step) => {
          step.status = "completed";
        });

        return result;
      } catch (error: any) {
        console.error("❌ Analysis error:", error);
        this.error = error.message || "Analysis failed";
        this.isLoading = false;
        this.progress = 0;

        // Mark current step as error
        if (this.currentStep < this.processingSteps.length) {
          this.processingSteps[this.currentStep].status = "error";
        }

        throw error;
      }
    },

    runEnhancedAnalysis(analysisData: any) {
      const files = Object.values(analysisData.files).filter(
        (f) => f !== null
      ) as File[];
      console.log("🔧 Enhanced analysis with data:", {
        category: analysisData.category,
        fileCount: files.length,
        files: files.map((f) => f.name),
      });
      return this.startAnalysis(files);
    },

    updateProgress(message: string, progress: number): void {
      console.log("📈 Progress update:", progress + "%", message);
      this.progressMessage = message;
      this.progress = Math.min(progress, 100);

      // Update step status based on progress
      const stepProgress = Math.floor(
        (progress / 100) * this.processingSteps.length
      );
      this.currentStep = Math.min(
        stepProgress,
        this.processingSteps.length - 1
      );

      // Mark steps as completed
      for (let i = 0; i < stepProgress; i++) {
        if (this.processingSteps[i].status !== "completed") {
          this.processingSteps[i].status = "completed";
        }
      }

      // Mark current step as processing
      if (stepProgress < this.processingSteps.length) {
        this.processingSteps[stepProgress].status = "processing";
      }
    },

    clearAnalysis() {
      this.analysisResult = null;
      this.error = null;
      this.progress = 0;
      this.progressMessage = "";
      this.currentStep = 0;
      this.isLoading = false;

      // Reset all steps
      this.processingSteps.forEach((step) => {
        step.status = "pending";
      });
    },

    // Health check method
    async checkBackendConnection() {
      try {
        await analysisService.checkBackendHealth();
        return true;
      } catch (error) {
        console.error("Backend health check failed:", error);
        return false;
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
  },
});
