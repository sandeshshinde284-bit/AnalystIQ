import { defineStore } from "pinia";
import analysisService from "@/services/analysis.service";
import { AnalysisResult } from "@/services/analysis.service";
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
    async startAnalysis(files: File[]): Promise<any> {
      this.isLoading = true;
      this.error = null;
      this.progress = 0;
      this.currentStep = 0;

      try {
        const result = await analysisService.processAnalysis(
          files,
          this.updateProgress.bind(this)
        );

        this.analysisResult = result;
        this.isLoading = false;

        return result;
      } catch (error) {
        this.error = (error as Error).message;
        this.isLoading = false;
        throw error;
      }
    },

    updateProgress(message: string, progress: number): void {
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

      // Reset all steps
      this.processingSteps.forEach((step) => {
        step.status = "pending";
      });
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
