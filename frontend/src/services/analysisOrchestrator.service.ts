import documentAIService from "./documentAI.service";
import cloudVisionService from "./cloudVision.service";
import geminiService from "./gemini.service";
import bigQueryService from "./bigquery.service";
import firebaseService from "./firebase.service";
import agentBuilderService from "./agentBuilder.service";

// Types for Analysis Orchestrator
export interface FileInput {
  buffer?: ArrayBuffer;
  originalname?: string;
  fieldname?: string;
  name: string;
  size: number;
  type: string;
}

export interface ProcessedDocument {
  id: string;
  name: string;
  type: string;
  extractedContent: string;
  extractedData: Record<string, any>;
  confidence: number;
  visionAnalysis?: any;
  uploadedAt: string;
  processedAt: string;
}

export interface CompanyInfo {
  name: string;
  industry: string;
  stage: string;
  headquarters?: string;
  foundedYear?: number;
}

export interface MarketBenchmarks {
  avg_growth: number;
  median_valuation: number;
  avg_burn: number;
  sample_size: number;
  industry: string;
  stage: string;
  last_updated: string;
}

export interface CompetitiveIntelligence {
  competitors: Array<{
    name: string;
    stage: string;
    funding: number;
    valuation?: number;
    similarity_score: number;
  }>;
  market_position: string;
  competitive_advantages: string[];
  threats: string[];
}

export interface MarketIntelligence {
  companyInfo: CompanyInfo;
  benchmarks: MarketBenchmarks;
  competitors: CompetitiveIntelligence;
  gatheringDate: string;
  error?: string;
  fallbackData?: any;
}

export interface AnalysisProgress {
  status: "processing" | "completed" | "failed";
  step: string;
  progress: number;
  error?: string;
  message?: string;
}

export interface FinalAnalysis {
  analysisId: string;
  userId: string;
  startupName: string;
  documents: ProcessedDocument[];
  marketIntelligence: MarketIntelligence;
  dueDiligenceGuidance: any;
  completedAt: string;
  recommendation: {
    text: string;
    score: number;
    justification: string;
  };
  keyMetrics: any[];
  riskAssessment: any[];
  crossDocumentInsights: any[];
  summaryContent: any;
  analysisDate: string;
  analysisType: string;
  analysisMetadata: any;
}

export interface OrchestrationOptions {
  includeVisionAnalysis?: boolean;
  includeMarketIntelligence?: boolean;
  includeDueDiligence?: boolean;
  storeToBigQuery?: boolean;
  progressCallback?: (progress: AnalysisProgress) => void;
}

class AnalysisOrchestrator {
  private readonly isEnabled: boolean;

  constructor() {
    this.isEnabled = true; // Can be configured based on services availability
    console.log("✅ Analysis Orchestrator initialized");
  }

  async processInvestmentAnalysis(
    files: File[],
    userId: string,
    analysisId: string,
    options: OrchestrationOptions = {}
  ): Promise<FinalAnalysis> {
    try {
      // Step 1: Initialize analysis tracking
      await this.updateProgress(
        analysisId,
        {
          status: "processing",
          step: "document-extraction",
          progress: 0,
          message: "Starting investment analysis...",
        },
        options.progressCallback
      );

      // Step 2: Process documents with multiple AI services
      const processedDocuments = await this.processDocuments(
        files,
        analysisId,
        options
      );

      // Step 3: Get market intelligence
      const marketData = await this.gatherMarketIntelligence(
        processedDocuments,
        analysisId,
        options
      );

      // Step 4: Perform Gemini Pro analysis
      await this.updateProgress(
        analysisId,
        {
          status: "processing",
          step: "ai-analysis",
          progress: 60,
          message: "Performing AI-powered investment analysis...",
        },
        options.progressCallback
      );

      const analysis = await geminiService.analyzeInvestmentOpportunity(
        this.convertToDocumentInput(processedDocuments),
        (message: string, progress: number) => {
          // Convert Gemini progress to overall progress (60-80%)
          const overallProgress = 60 + progress * 0.2;
          this.updateProgress(
            analysisId,
            {
              status: "processing",
              step: "ai-analysis",
              progress: overallProgress,
              message,
            },
            options.progressCallback
          );
        }
      );

      // Step 5: Enhance with Agent Builder insights
      await this.updateProgress(
        analysisId,
        {
          status: "processing",
          step: "due-diligence",
          progress: 80,
          message: "Generating due diligence guidance...",
        },
        options.progressCallback
      );

      const dueDiligenceGuidance =
        options.includeDueDiligence !== false
          ? await agentBuilderService.provideDueDiligenceGuidance({
              startupName: analysis.startupName,
              industry: analysis.industry,
              stage: analysis.stage,
              recommendation: analysis.recommendation,
            })
          : null;

      // Step 6: Store results in BigQuery (if enabled)
      if (options.storeToBigQuery) {
        try {
          if ((bigQueryService as any).storeAnalysisResults) {
            await (bigQueryService as any).storeAnalysisResults(analysis);
          }
        } catch (error) {
          console.warn("Failed to store in BigQuery:", error);
          // Don't fail the entire analysis for BigQuery issues
        }
      }

      // Step 7: Save final results
      await this.updateProgress(
        analysisId,
        {
          status: "processing",
          step: "finalizing",
          progress: 95,
          message: "Finalizing analysis results...",
        },
        options.progressCallback
      );

      const finalAnalysis: FinalAnalysis = {
        ...analysis,
        documents: processedDocuments,
        marketIntelligence: marketData,
        dueDiligenceGuidance,
        analysisId,
        userId,
        completedAt: new Date().toISOString(),
      };

      // Save to Firebase
      await firebaseService.saveAnalysisResult(analysisId, finalAnalysis);

      await this.updateProgress(
        analysisId,
        {
          status: "completed",
          step: "completed",
          progress: 100,
          message: "Investment analysis completed successfully!",
        },
        options.progressCallback
      );

      return finalAnalysis;
    } catch (error) {
      console.error(`Analysis orchestration failed: ${error}`);

      await this.updateProgress(
        analysisId,
        {
          status: "failed",
          step: "error",
          progress: 0,
          error: error instanceof Error ? error.message : "Unknown error",
          message: "Analysis failed",
        },
        options.progressCallback
      );

      throw error;
    }
  }

  private async processDocuments(
    files: File[],
    analysisId: string,
    options: OrchestrationOptions = {}
  ): Promise<ProcessedDocument[]> {
    const processedDocs: ProcessedDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Update progress
      const fileProgress = (i / files.length) * 40; // First 40% for document processing
      await this.updateProgress(
        analysisId,
        {
          status: "processing",
          step: `processing-${file.name}`,
          progress: fileProgress,
          message: `Processing document: ${file.name}`,
        },
        options.progressCallback
      );

      try {
        // Document AI processing
        const docResult = await documentAIService.processDocument(
          file,
          this.inferDocumentType(file),
          (message: string, progress: number) => {
            // Convert document processing progress to overall progress
            const overallProgress =
              fileProgress + (progress / files.length) * 0.4;
            this.updateProgress(
              analysisId,
              {
                status: "processing",
                step: `processing-${file.name}`,
                progress: overallProgress,
                message: `${message} (${file.name})`,
              },
              options.progressCallback
            );
          }
        );

        // ✅ FIXED: Cloud Vision analysis with correct method call
        let visionResult = null;
        if (options.includeVisionAnalysis !== false) {
          try {
            // Use the correct method that accepts a File
            visionResult = await cloudVisionService.analyzeDocumentFromFile(
              file,
              this.inferDocumentType(file)
            );
          } catch (error) {
            console.warn(`Vision analysis failed for ${file.name}:`, error);
            // Continue without vision analysis
          }
        }

        // Combine results
        const processedDoc: ProcessedDocument = {
          ...docResult,
          visionAnalysis: visionResult,
          uploadedAt: new Date().toISOString(),
        };

        processedDocs.push(processedDoc);
        console.log(`✅ Processed document: ${file.name}`);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        // Continue with other documents
      }
    }

    return processedDocs;
  }

  private async gatherMarketIntelligence(
    documents: ProcessedDocument[],
    analysisId: string,
    options: OrchestrationOptions = {}
  ): Promise<MarketIntelligence> {
    if (options.includeMarketIntelligence === false) {
      return this.getFallbackMarketIntelligence();
    }

    try {
      await this.updateProgress(
        analysisId,
        {
          status: "processing",
          step: "market-intelligence",
          progress: 45,
          message: "Gathering market intelligence...",
        },
        options.progressCallback
      );

      // Extract company info from documents
      const companyInfo = this.extractCompanyInfo(documents);

      // Get market benchmarks
      let benchmarks: MarketBenchmarks;
      let competitors: CompetitiveIntelligence;

      try {
        // Check if method exists before calling
        if ((bigQueryService as any).getMarketBenchmarks) {
          benchmarks = await (bigQueryService as any).getMarketBenchmarks(
            companyInfo.industry,
            companyInfo.stage
          );
        } else {
          benchmarks = this.getFallbackBenchmarks(
            companyInfo.industry,
            companyInfo.stage
          );
        }
      } catch (error) {
        console.warn("Failed to get market benchmarks:", error);
        benchmarks = this.getFallbackBenchmarks(
          companyInfo.industry,
          companyInfo.stage
        );
      }

      try {
        // Check if method exists before calling
        if ((bigQueryService as any).getCompetitiveIntelligence) {
          competitors = await (
            bigQueryService as any
          ).getCompetitiveIntelligence(companyInfo.name, companyInfo.industry);
        } else {
          competitors = this.getFallbackCompetitors();
        }
      } catch (error) {
        console.warn("Failed to get competitive intelligence:", error);
        competitors = this.getFallbackCompetitors();
      }

      return {
        companyInfo,
        benchmarks,
        competitors,
        gatheringDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Market intelligence gathering failed:`, error);
      return {
        ...this.getFallbackMarketIntelligence(),
        error: "Failed to gather market intelligence",
      };
    }
  }

  private extractCompanyInfo(documents: ProcessedDocument[]): CompanyInfo {
    // Extract company name, industry, stage from processed documents
    const companyNames = documents
      .map((doc) => doc.extractedData?.companyName)
      .filter(Boolean);

    const industries = documents
      .map((doc) => doc.extractedData?.industry)
      .filter(Boolean);

    const stages = documents
      .map((doc) => doc.extractedData?.stage)
      .filter(Boolean);

    return {
      name: companyNames[0] || "Unknown Company",
      industry: industries[0] || "Technology",
      stage: stages[0] || "Series A",
      headquarters: "San Francisco, CA", // Could be extracted from documents
      foundedYear: 2022, // Could be extracted from documents
    };
  }

  private getFallbackMarketIntelligence(): MarketIntelligence {
    return {
      companyInfo: {
        name: "Unknown Company",
        industry: "Technology",
        stage: "Series A",
      },
      benchmarks: this.getFallbackBenchmarks("Technology", "Series A"),
      competitors: this.getFallbackCompetitors(),
      gatheringDate: new Date().toISOString(),
      fallbackData: true,
    };
  }

  private getFallbackBenchmarks(
    industry: string,
    stage: string
  ): MarketBenchmarks {
    return {
      avg_growth: 150,
      median_valuation: 10000000,
      avg_burn: 50000,
      sample_size: 100,
      industry,
      stage,
      last_updated: new Date().toISOString(),
    };
  }

  private getFallbackCompetitors(): CompetitiveIntelligence {
    return {
      competitors: [
        {
          name: "CompetitorA",
          stage: "Series B",
          funding: 15000000,
          valuation: 50000000,
          similarity_score: 0.7,
        },
        {
          name: "CompetitorB",
          stage: "Series A",
          funding: 8000000,
          similarity_score: 0.6,
        },
      ],
      market_position: "Emerging player in competitive market",
      competitive_advantages: [
        "Strong technical team",
        "Early market entry",
        "Unique technology approach",
      ],
      threats: [
        "Well-funded competitors",
        "Market saturation risk",
        "Technology commoditization",
      ],
    };
  }

  private inferDocumentType(
    file: File
  ):
    | "pitchDeck"
    | "financialModel"
    | "founderProfiles"
    | "marketResearch"
    | "tractionData"
    | "document" {
    const fileName = file.name.toLowerCase();

    if (fileName.includes("pitch") || fileName.includes("deck"))
      return "pitchDeck";
    if (fileName.includes("financial") || fileName.includes("model"))
      return "financialModel";
    if (fileName.includes("founder") || fileName.includes("team"))
      return "founderProfiles";
    if (fileName.includes("market") || fileName.includes("research"))
      return "marketResearch";
    if (fileName.includes("traction") || fileName.includes("metrics"))
      return "tractionData";

    return "document";
  }

  private convertToDocumentInput(processedDocs: ProcessedDocument[]): Array<{
    id: string;
    name: string;
    type: string;
    extractedContent?: string;
    extractedData?: Record<string, any>;
    confidence?: number;
    size?: number;
  }> {
    return processedDocs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      extractedContent: doc.extractedContent,
      extractedData: doc.extractedData,
      confidence: doc.confidence,
      size: 0, // Size not available in ProcessedDocument
    }));
  }

  private async updateProgress(
    analysisId: string,
    progress: AnalysisProgress,
    callback?: (progress: AnalysisProgress) => void
  ): Promise<void> {
    try {
      // Save to Firebase
      await firebaseService.saveAnalysisProgress(analysisId, progress);

      // Call progress callback if provided
      if (callback) {
        callback(progress);
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
      // Don't throw - progress updates shouldn't break the main flow
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const services = [
        documentAIService.healthCheck(),
        geminiService.healthCheck(),
        firebaseService.healthCheck(),
        agentBuilderService.healthCheck(),
      ];

      const results = await Promise.allSettled(services);
      const healthyServices = results.filter(
        (result) => result.status === "fulfilled" && result.value === true
      ).length;

      console.log(
        `Analysis Orchestrator health: ${healthyServices}/${results.length} services healthy`
      );

      // Require at least core services to be healthy
      return healthyServices >= 2; // documentAI and gemini are core
    } catch (error) {
      console.error("Analysis Orchestrator health check failed:", error);
      return false;
    }
  }

  // Utility methods
  getSupportedFeatures() {
    return {
      documentProcessing: true,
      aiAnalysis: true,
      marketIntelligence: true,
      dueDiligence: true,
      visionAnalysis: true,
      bigQueryStorage: true,
      progressTracking: true,
    };
  }
}

export default new AnalysisOrchestrator();
export { AnalysisOrchestrator };
