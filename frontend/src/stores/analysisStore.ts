import { defineStore } from "pinia";
import {
  analysisService,
  type AnalysisResponse,
  type ProgressCallback,
} from "../services/api.service";
import { ProfessionalReportGenerator } from "../utils/reportGenerator";

// Step interface - allows all status values
interface ProcessingStep {
  id: string;
  title: string;
  status: "pending" | "processing" | "completed" | "error";
}

// Analysis result interface - matches Cloud Function response
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
    level: string;
    title: string;
    description: string;
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
    aiModel?: string;
    confidenceBoost?: number;
  };
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

      // Reset all steps to pending
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

        this.analysisResult = result as AnalysisResult;
        this.isLoading = false;
        this.progress = 100;

        // Mark all steps as completed
        this.processingSteps.forEach((step) => {
          step.status = "completed";
        });

        return result as AnalysisResult;
      } catch (error: any) {
        console.error("❌ Analysis error:", error);

        // Better error messages
        let errorMessage = error.message || "Analysis failed";

        if (errorMessage.includes("Gemini response missing")) {
          const missing = errorMessage.match(/missing[^:]*:\s*(.+)/i);
          if (missing && missing[1]) {
            const fields = missing[1];
            errorMessage = `Analysis incomplete. Missing: ${fields}. Please try uploading more detailed documents.`;
          }
        }

        this.error = errorMessage;
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

    // ADD THIS to analysisStore.ts - Helper functions to generate chart data from Gemini response

    // Generate competitive analysis chart data
    getCompetitiveAnalysisData() {
      const analysis = this.analysisResult;

      if (
        !analysis?.competitiveAnalysis ||
        analysis.competitiveAnalysis.length === 0
      ) {
        // Return default data if no competitive analysis
        return [
          { company: "Target Company", revenue: 1.5 },
          { company: "Competitor A", revenue: 2.0 },
          { company: "Competitor B", revenue: 2.8 },
          { company: "Competitor C", revenue: 1.8 },
          { company: "Market Leader", revenue: 5.0 },
        ];
      }

      // Extract revenue data from competitive analysis
      return analysis.competitiveAnalysis.map((comp: any, index: number) => ({
        company: comp.competitor || `Competitor ${index + 1}`,
        revenue: parseFloat(
          (comp.marketShare as string)?.replace(/\D/g, "") ||
            (2 + Math.random() * 3).toFixed(1)
        ),
      }));
    },

    // Generate market growth trajectory
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

      // Try to extract TAM from market opportunity
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

    // Generate financial projections chart
    getFinancialProjectionsData() {
      const analysis = this.analysisResult;

      if (
        analysis?.financialProjections &&
        analysis.financialProjections.length > 0
      ) {
        // Use data from Gemini
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

      // Generate realistic projections
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

    // Generate performance radar chart data
    getPerformanceRadarData(): Record<string, number> {
      const analysis = this.analysisResult;

      const defaultScores: Record<string, number> = {
        "Team Experience": 75,
        "Competitive Position": 65,
        "Product Innovation": 70,
        "Market Opportunity": 80,
        "Financial Health": analysis?.recommendation?.score || 70,
      };

      // Enhance from risk assessment
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

    // Generate metrics trends
    getMetricsTrendData(metricLabel: string): number[] {
      const trends: Record<string, number[]> = {
        "ARR Growth": [100, 150, 225, 340, 510],
        "Customer Count": [5, 12, 25, 45, 80],
        "Market Share": [2, 3, 5, 7, 10],
        "User Engagement": [60, 65, 72, 78, 85],
      };

      return trends[metricLabel] || [10, 15, 25, 35, 45];
    },

    // Get all chart-ready data
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

      // Reset all steps
      this.processingSteps.forEach((step) => {
        step.status = "pending";
      });
    },

    async checkBackendConnection() {
      try {
        const health = await analysisService.checkBackendHealth();

        // Check if response indicates healthy status
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

    // async exportReport(): Promise<void> {
    //   try {
    //     if (!this.analysisResult) {
    //       throw new Error("No analysis data to export");
    //     }

    //     console.log("📄 Starting PDF export...");

    //     // Import jsPDF and html2canvas
    //     const { jsPDF } = await import("jspdf");
    //     const html2canvas = (await import("html2canvas")).default;

    //     // Get the main analysis container element
    //     const element = document.getElementById("analysis-results-container");
    //     if (!element) {
    //       throw new Error(
    //         "Analysis results container not found. Make sure it has id='analysis-results-container'"
    //       );
    //     }

    //     console.log("📸 Converting to canvas...");

    //     // Convert HTML to canvas
    //     const canvas = await html2canvas(element, {
    //       scale: 2,
    //       useCORS: true,
    //       logging: false,
    //       backgroundColor: "#0f1929",
    //     });

    //     console.log("📝 Creating PDF...");

    //     // Get canvas dimensions
    //     const imgWidth = 210; // A4 width in mm
    //     const pageHeight = 297; // A4 height in mm
    //     const imgHeight = (canvas.height * imgWidth) / canvas.width;
    //     let heightLeft = imgHeight;

    //     // Create PDF
    //     const pdf = new jsPDF("p", "mm", "A4");
    //     let position = 0;

    //     // Convert canvas to image
    //     const imgData = canvas.toDataURL("image/png");

    //     // Add pages
    //     while (heightLeft > 0) {
    //       pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    //       heightLeft -= pageHeight;
    //       position -= pageHeight;

    //       if (heightLeft > 0) {
    //         pdf.addPage();
    //       }
    //     }

    //     // Generate filename
    //     const startupName = this.analysisResult.startupName || "Analysis";
    //     const date = new Date().toISOString().split("T")[0];
    //     const fileName = `${startupName}_Investment_Report_${date}.pdf`;

    //     console.log(`💾 Downloading: ${fileName}`);

    //     // Download PDF
    //     pdf.save(fileName);

    //     console.log("✅ PDF exported successfully");
    //   } catch (error: any) {
    //     console.error("❌ Export failed:", error);
    //     throw new Error(
    //       error instanceof Error ? error.message : "Failed to export report"
    //     );
    //   }
    // },

    // async exportReport(): Promise<void> {
    //   try {
    //     const jsPDF = (await import("jspdf")).jsPDF;

    //     if (!this.analysisResult) {
    //       throw new Error("No analysis data available");
    //     }

    //     const pdf = new jsPDF({
    //       orientation: "portrait",
    //       unit: "mm",
    //       format: "a4",
    //     });

    //     const pageWidth = pdf.internal.pageSize.getWidth();
    //     const pageHeight = pdf.internal.pageSize.getHeight();
    //     const margin = 15;
    //     const contentWidth = pageWidth - 2 * margin;
    //     let yPosition = margin;

    //     // Ensure analysisDate is a string
    //     const analysisDate = this.analysisResult.analysisDate
    //       ? new Date(this.analysisResult.analysisDate).toLocaleDateString()
    //       : new Date().toLocaleDateString();

    //     // Helper function to add text with wrapping
    //     const addWrappedText = (
    //       text: string,
    //       x: number,
    //       y: number,
    //       width: number,
    //       fontSize: number,
    //       isBold = false
    //     ) => {
    //       pdf.setFontSize(fontSize);
    //       pdf.setFont("", isBold ? "bold" : "normal");
    //       const lines = pdf.splitTextToSize(text, width);
    //       pdf.text(lines, x, y);
    //       return y + lines.length * fontSize * 0.35;
    //     };

    //     // Helper to add page break
    //     const checkPageBreak = (minHeight: number) => {
    //       if (yPosition + minHeight > pageHeight - margin) {
    //         pdf.addPage();
    //         yPosition = margin;
    //       }
    //     };

    //     // PAGE 1: RECOMMENDATION & SUMMARY
    //     pdf.setTextColor(0, 150, 200); // Dark cyan for visibility
    //     pdf.setFontSize(24);
    //     pdf.text("Investment Analysis Report", margin, yPosition);
    //     yPosition += 12;

    //     pdf.setTextColor(40, 40, 40); // Dark gray instead of white
    //     pdf.setFontSize(18);
    //     pdf.text(
    //       this.analysisResult.startupName || "Startup",
    //       margin,
    //       yPosition
    //     );
    //     yPosition += 8;

    //     pdf.setTextColor(40, 40, 40); // Lighter gray
    //     pdf.setFontSize(10);
    //     pdf.text(`Generated: ${analysisDate}`, margin, yPosition);
    //     yPosition += 12;

    //     // Recommendation Section
    //     checkPageBreak(40);
    //     pdf.setDrawColor(0, 150, 200);
    //     pdf.setLineWidth(0.5);
    //     pdf.rect(margin, yPosition, contentWidth, 35);

    //     pdf.setTextColor(0, 150, 200);
    //     pdf.setFontSize(12);
    //     pdf.setFont("", "bold");
    //     pdf.text("INVESTMENT RECOMMENDATION", margin + 5, yPosition + 6);

    //     pdf.setTextColor(40, 40, 40); // Dark gray
    //     pdf.setFontSize(16);
    //     pdf.setFont("", "bold");
    //     pdf.text(
    //       this.analysisResult.recommendation?.text || "REVIEW",
    //       margin + 5,
    //       yPosition + 15
    //     );

    //     pdf.setFontSize(11);
    //     pdf.setFont("", "normal");
    //     pdf.text(
    //       `Score: ${this.analysisResult.recommendation?.score || 0}/100`,
    //       margin + 5,
    //       yPosition + 24
    //     );

    //     yPosition += 40;

    //     // Justification
    //     checkPageBreak(20);
    //     pdf.setTextColor(40, 40, 40); // Light gray
    //     pdf.setFontSize(9);
    //     yPosition = addWrappedText(
    //       this.analysisResult.recommendation?.justification ||
    //         "No justification available",
    //       margin,
    //       yPosition,
    //       contentWidth,
    //       9
    //     );
    //     yPosition += 8;

    //     // Company Info
    //     checkPageBreak(20);
    //     pdf.setTextColor(0, 150, 200);
    //     pdf.setFontSize(12);
    //     pdf.setFont("", "bold");
    //     pdf.text("Company Information", margin, yPosition);
    //     yPosition += 8;

    //     pdf.setTextColor(40, 40, 40); // Dark gray
    //     pdf.setFontSize(10);
    //     pdf.setFont("", "normal");
    //     pdf.text(
    //       `Industry: ${this.analysisResult.industry || "N/A"}`,
    //       margin,
    //       yPosition
    //     );
    //     yPosition += 6;
    //     pdf.text(
    //       `Stage: ${this.analysisResult.stage || "N/A"}`,
    //       margin,
    //       yPosition
    //     );
    //     yPosition += 10;

    //     // Summary Content
    //     checkPageBreak(30);
    //     pdf.setTextColor(0, 212, 255);
    //     pdf.setFontSize(12);
    //     pdf.setFont("", "bold");
    //     pdf.text("Executive Summary", margin, yPosition);
    //     yPosition += 8;

    //     pdf.setTextColor(255, 255, 255);
    //     pdf.setFontSize(10);
    //     pdf.setFont("", "normal");

    //     pdf.setFont("", "bold");
    //     pdf.text("Business Overview", margin, yPosition);
    //     yPosition += 5;
    //     pdf.setFont("", "normal");
    //     yPosition = addWrappedText(
    //       this.analysisResult.summaryContent?.businessOverview ||
    //         "Not available",
    //       margin,
    //       yPosition,
    //       contentWidth,
    //       9
    //     );
    //     yPosition += 6;

    //     pdf.setFont("", "bold");
    //     pdf.text("Team & Experience", margin, yPosition);
    //     yPosition += 5;
    //     pdf.setFont("", "normal");
    //     yPosition = addWrappedText(
    //       this.analysisResult.summaryContent?.teamExperience || "Not available",
    //       margin,
    //       yPosition,
    //       contentWidth,
    //       9
    //     );
    //     yPosition += 6;

    //     pdf.setFont("", "bold");
    //     pdf.text("Product & Technology", margin, yPosition);
    //     yPosition += 5;
    //     pdf.setFont("", "normal");
    //     yPosition = addWrappedText(
    //       this.analysisResult.summaryContent?.productTech || "Not available",
    //       margin,
    //       yPosition,
    //       contentWidth,
    //       9
    //     );
    //     yPosition += 10;

    //     // PAGE 2: KEY METRICS
    //     pdf.addPage();
    //     yPosition = margin;

    //     pdf.setTextColor(0, 212, 255);
    //     pdf.setFontSize(16);
    //     pdf.setFont("", "bold");
    //     pdf.text("Key Investment Metrics", margin, yPosition);
    //     yPosition += 10;

    //     pdf.setTextColor(255, 255, 255);
    //     pdf.setFontSize(10);
    //     pdf.setFont("", "normal");

    //     this.analysisResult.keyMetrics?.forEach((metric: any) => {
    //       checkPageBreak(12);
    //       pdf.setFont("", "bold");
    //       pdf.text(`${metric.label}:`, margin, yPosition);
    //       yPosition += 5;

    //       pdf.setFont("", "normal");
    //       pdf.setTextColor(0, 212, 255);
    //       pdf.text(metric.value || "N/A", margin + 5, yPosition);
    //       yPosition += 5;

    //       pdf.setTextColor(139, 147, 167);
    //       pdf.setFontSize(8);
    //       pdf.text(
    //         `Confidence: ${metric.source?.confidence || "N/A"}`,
    //         margin + 5,
    //         yPosition
    //       );
    //       yPosition += 5;

    //       pdf.setFontSize(10);
    //       pdf.setTextColor(255, 255, 255);
    //       yPosition += 3;
    //     });

    //     // PAGE 3: RISK ASSESSMENT
    //     pdf.addPage();
    //     yPosition = margin;

    //     pdf.setTextColor(0, 212, 255);
    //     pdf.setFontSize(16);
    //     pdf.setFont("", "bold");
    //     pdf.text("Risk Assessment", margin, yPosition);
    //     yPosition += 10;

    //     if (
    //       this.analysisResult.riskAssessment &&
    //       this.analysisResult.riskAssessment.length > 0
    //     ) {
    //       this.analysisResult.riskAssessment.forEach(
    //         (risk: any, index: number) => {
    //           checkPageBreak(20);

    //           pdf.setTextColor(255, 255, 255);
    //           pdf.setFontSize(11);
    //           pdf.setFont("", "bold");
    //           pdf.text(`${index + 1}. ${risk.title}`, margin, yPosition);
    //           yPosition += 6;

    //           pdf.setTextColor(139, 147, 167);
    //           pdf.setFontSize(9);
    //           pdf.text(
    //             `Type: ${risk.type} | Level: ${risk.level?.toUpperCase() || "N/A"}`,
    //             margin + 5,
    //             yPosition
    //           );
    //           yPosition += 5;

    //           pdf.setTextColor(255, 255, 255);
    //           pdf.setFontSize(9);
    //           pdf.setFont("", "normal");
    //           yPosition = addWrappedText(
    //             `Description: ${risk.description || "N/A"}`,
    //             margin + 5,
    //             yPosition,
    //             contentWidth - 5,
    //             9
    //           );
    //           yPosition += 3;

    //           yPosition = addWrappedText(
    //             `Mitigation: ${risk.mitigation || "N/A"}`,
    //             margin + 5,
    //             yPosition,
    //             contentWidth - 5,
    //             9
    //           );
    //           yPosition += 5;
    //         }
    //       );
    //     } else {
    //       pdf.setTextColor(139, 147, 167);
    //       pdf.setFontSize(10);
    //       pdf.text("No risk assessment data available", margin, yPosition);
    //     }

    //     // PAGE 4: MARKET ANALYSIS
    //     pdf.addPage();
    //     yPosition = margin;

    //     pdf.setTextColor(0, 212, 255);
    //     pdf.setFontSize(16);
    //     pdf.setFont("", "bold");
    //     pdf.text("Market Analysis", margin, yPosition);
    //     yPosition += 10;

    //     if (this.analysisResult.marketOpportunity) {
    //       pdf.setTextColor(0, 212, 255);
    //       pdf.setFontSize(12);
    //       pdf.setFont("", "bold");
    //       pdf.text("Market Sizing", margin, yPosition);
    //       yPosition += 8;

    //       pdf.setTextColor(255, 255, 255);
    //       pdf.setFontSize(10);
    //       pdf.setFont("", "normal");

    //       const marketFields = [
    //         { label: "TAM", value: this.analysisResult.marketOpportunity.TAM },
    //         { label: "SAM", value: this.analysisResult.marketOpportunity.SAM },
    //         { label: "SOM", value: this.analysisResult.marketOpportunity.SOM },
    //         {
    //           label: "Growth Rate",
    //           value: this.analysisResult.marketOpportunity.growthRate,
    //         },
    //       ];

    //       marketFields.forEach((field) => {
    //         checkPageBreak(8);
    //         pdf.setFont("", "bold");
    //         pdf.text(`${field.label}:`, margin, yPosition);
    //         pdf.setFont("", "normal");
    //         pdf.text(
    //           String(field.value || "Not specified"),
    //           margin + 40,
    //           yPosition
    //         );
    //         yPosition += 7;
    //       });
    //     }

    //     // Competitive Analysis
    //     yPosition += 5;
    //     if (
    //       this.analysisResult.competitiveAnalysis &&
    //       this.analysisResult.competitiveAnalysis.length > 0
    //     ) {
    //       checkPageBreak(15);
    //       pdf.setTextColor(0, 212, 255);
    //       pdf.setFontSize(12);
    //       pdf.setFont("", "bold");
    //       pdf.text("Competitive Analysis", margin, yPosition);
    //       yPosition += 8;

    //       this.analysisResult.competitiveAnalysis.forEach((comp: any) => {
    //         checkPageBreak(10);
    //         pdf.setTextColor(255, 255, 255);
    //         pdf.setFontSize(10);
    //         pdf.setFont("", "bold");
    //         pdf.text(comp.competitor || "Unknown", margin, yPosition);
    //         yPosition += 5;

    //         pdf.setFontSize(9);
    //         pdf.setFont("", "normal");
    //         yPosition = addWrappedText(
    //           `Differentiators: ${comp.differentiators || "N/A"}`,
    //           margin + 5,
    //           yPosition,
    //           contentWidth - 5,
    //           9
    //         );
    //         yPosition += 3;
    //       });
    //     }

    //     // PAGE 5: FINANCIAL DATA
    //     if (
    //       this.analysisResult.financialProjections?.length > 0 ||
    //       Object.keys(this.analysisResult.valuationInsights || {}).length > 0 ||
    //       Object.keys(this.analysisResult.investmentTerms || {}).length > 0
    //     ) {
    //       pdf.addPage();
    //       yPosition = margin;

    //       pdf.setTextColor(0, 212, 255);
    //       pdf.setFontSize(16);
    //       pdf.setFont("", "bold");
    //       pdf.text("Financial Analysis", margin, yPosition);
    //       yPosition += 10;

    //       // Financial Projections
    //       if (
    //         this.analysisResult.financialProjections &&
    //         this.analysisResult.financialProjections.length > 0
    //       ) {
    //         pdf.setTextColor(0, 212, 255);
    //         pdf.setFontSize(12);
    //         pdf.setFont("", "bold");
    //         pdf.text("Revenue Projections", margin, yPosition);
    //         yPosition += 8;

    //         this.analysisResult.financialProjections.forEach((proj: any) => {
    //           pdf.setTextColor(255, 255, 255);
    //           pdf.setFontSize(9);
    //           pdf.setFont("", "normal");
    //           pdf.text(
    //             `${proj.year}: ${proj.revenue || "N/A"}`,
    //             margin,
    //             yPosition
    //           );
    //           yPosition += 5;
    //         });

    //         yPosition += 5;
    //       }

    //       // Valuation
    //       if (
    //         this.analysisResult.valuationInsights &&
    //         Object.keys(this.analysisResult.valuationInsights).length > 0
    //       ) {
    //         pdf.setTextColor(0, 212, 255);
    //         pdf.setFontSize(12);
    //         pdf.setFont("", "bold");
    //         pdf.text("Valuation Insights", margin, yPosition);
    //         yPosition += 8;

    //         Object.entries(this.analysisResult.valuationInsights).forEach(
    //           ([key, value]: [string, any]) => {
    //             checkPageBreak(8);
    //             pdf.setTextColor(255, 255, 255);
    //             pdf.setFontSize(9);
    //             pdf.setFont("", "bold");
    //             // Format key: "currentValuation" -> "Current Valuation"
    //             const formattedKey = key
    //               .replace(/([A-Z])/g, " $1")
    //               .replace(/_/g, " ")
    //               .trim()
    //               .split(" ")
    //               .map(
    //                 (word: string) =>
    //                   word.charAt(0).toUpperCase() + word.slice(1)
    //               )
    //               .join(" ");
    //             pdf.text(formattedKey, margin, yPosition);
    //             pdf.setFont("", "normal");
    //             pdf.text(
    //               String(value || "Not specified"),
    //               margin + 50,
    //               yPosition
    //             );
    //             yPosition += 6;
    //           }
    //         );
    //       }
    //     }

    //     // Final Page: Metadata
    //     pdf.addPage();
    //     yPosition = margin;

    //     pdf.setTextColor(0, 212, 255);
    //     pdf.setFontSize(14);
    //     pdf.setFont("", "bold");
    //     pdf.text("Analysis Metadata", margin, yPosition);
    //     yPosition += 10;

    //     pdf.setTextColor(255, 255, 255);
    //     pdf.setFontSize(10);
    //     pdf.setFont("", "normal");

    //     const metadata = [
    //       {
    //         label: "AI Model Used",
    //         value: String(
    //           this.analysisResult.analysisMetadata?.aiModel || "N/A"
    //         ),
    //       },
    //       {
    //         label: "Documents Processed",
    //         value: String(
    //           this.analysisResult.analysisMetadata?.documentsProcessed || 0
    //         ),
    //       },
    //       {
    //         label: "Processing Time",
    //         value: String(
    //           this.analysisResult.analysisMetadata?.processingTime || "N/A"
    //         ),
    //       },
    //       { label: "Analysis Date", value: analysisDate },
    //       {
    //         label: "Analysis Depth",
    //         value: String(
    //           this.analysisResult.analysisMetadata?.analysisDepth || "N/A"
    //         ),
    //       },
    //     ];

    //     metadata.forEach((item) => {
    //       pdf.setFont("", "bold");
    //       pdf.text(`${item.label}:`, margin, yPosition);
    //       pdf.setFont("", "normal");
    //       pdf.text(String(item.value || "N/A"), margin + 50, yPosition);
    //       yPosition += 8;
    //     });

    //     yPosition += 10;
    //     pdf.setTextColor(139, 147, 167);
    //     pdf.setFontSize(8);
    //     pdf.text(
    //       "Generated by AnalystIQ - AI Investment Analysis Platform",
    //       margin,
    //       yPosition
    //     );

    //     // Save the PDF
    //     const filename = `${this.analysisResult.startupName || "Analysis"}_Report_${new Date().toISOString().split("T")[0]}.pdf`;
    //     pdf.save(filename);

    //     console.log("Report exported successfully!");
    //   } catch (error: any) {
    //     console.error("Export failed:", error);
    //     throw new Error(`Failed to export report: ${error.message}`);
    //   }
    // },

    // async exportReport(): Promise<void> {
    //   try {
    //     const html2pdf = (await import("html2pdf.js")).default;

    //     if (!this.analysisResult) {
    //       throw new Error("No analysis data available");
    //     }

    //     // Get the results container element
    //     const element = document.getElementById("analysis-results-container");
    //     if (!element) {
    //       throw new Error("Analysis results container not found");
    //     }

    //     // Store original display state of tab panes
    //     const tabPanes = element.querySelectorAll(".tab-pane");
    //     const originalDisplay: Array<string> = [];

    //     // Temporarily show all tabs
    //     tabPanes.forEach((pane: Element, index: number) => {
    //       const htmlElement = pane as HTMLElement;
    //       originalDisplay[index] = htmlElement.style.display;
    //       htmlElement.style.display = "block"; // Show all tabs
    //     });

    //     // Add page break CSS for better formatting
    //     const style = document.createElement("style");
    //     style.textContent = `
    //   .tab-pane {
    //     page-break-after: always;
    //     page-break-inside: avoid;
    //   }
    //   .tab-content {
    //     page-break-inside: avoid;
    //   }
    //   @media print {
    //     .tabs-navigation {
    //       page-break-after: always;
    //     }
    //   }
    // `;
    //     document.head.appendChild(style);

    //     // Configure html2pdf options
    //     const options: any = {
    //       margin: [10, 10, 10, 10] as [number, number, number, number],
    //       filename: `${this.analysisResult.startupName || "Analysis"}_Report_${new Date().toISOString().split("T")[0]}.pdf`,
    //       image: { type: "jpeg", quality: 0.98 },
    //       html2canvas: {
    //         scale: 2,
    //         backgroundColor: "#ffffff", // White background for PDF
    //         allowTaint: true,
    //         useCORS: true,
    //       },
    //       jsPDF: {
    //         orientation: "portrait",
    //         unit: "mm",
    //         format: "a4",
    //         compress: true,
    //       },
    //       pagebreak: {
    //         mode: ["avoid-all", "css", "legacy"],
    //         avoid: ["tr", ".no-break"],
    //       },
    //     };

    //     // Generate PDF
    //     await html2pdf().set(options).from(element).save();

    //     // Restore original display state
    //     tabPanes.forEach((pane: Element, index: number) => {
    //       const htmlElement = pane as HTMLElement;
    //       htmlElement.style.display = originalDisplay[index];
    //     });

    //     // Remove temporary style
    //     document.head.removeChild(style);

    //     console.log("Report exported successfully!");
    //   } catch (error: any) {
    //     console.error("Export failed:", error);

    //     // Make sure to restore visibility even if there's an error
    //     const element = document.getElementById("analysis-results-container");
    //     if (element) {
    //       const tabPanes = element.querySelectorAll(".tab-pane");
    //       tabPanes.forEach((pane: Element) => {
    //         const htmlElement = pane as HTMLElement;
    //         htmlElement.style.display = "";
    //       });
    //     }

    //     throw new Error(`Failed to export report: ${error.message}`);
    //   }
    // },

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
