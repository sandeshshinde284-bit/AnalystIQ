import { googleCloudConfig } from "@/config/googleCloud";

// Import all Google Cloud services
import geminiService from "./gemini.service";
import documentAIService from "./documentAI.service";
import bigQueryService from "./bigquery.service";
import agentBuilderService from "./agentBuilder.service";

// Import types from services
import type { DocumentInput, GeminiAnalysisResult } from "./gemini.service";
import type { DocumentAIResult, DocumentType } from "./documentAI.service";
import type { DueDiligenceGuidance } from "./agentBuilder.service";

// Types for Google Cloud Service
export interface GoogleCloudServices {
  gemini: typeof geminiService;
  documentAI: typeof documentAIService;
  bigQuery: typeof bigQueryService;
  agentBuilder: typeof agentBuilderService;
}

export interface ServiceHealth {
  service: string;
  status: "healthy" | "degraded" | "down";
  latency?: number;
  lastCheck: string;
  error?: string;
}

export interface CloudConfiguration {
  projectId: string;
  location: string;
  environment: "development" | "staging" | "production";
  services: {
    enabled: string[];
    disabled: string[];
  };
}

export interface MarketIntelligenceData {
  benchmarks: {
    avg_growth: number;
    median_valuation: number;
    avg_burn: number;
    sample_size: number;
    industry: string;
    stage: string;
  };
  competitors: Array<{
    name: string;
    stage: string;
    funding: number;
    similarity_score: number;
  }>;
  riskFactors: string[];
  opportunities: string[];
  gatheringDate: string;
}

export interface ProcessingPipeline {
  documents: DocumentAIResult[];
  analysis: GeminiAnalysisResult & {
    marketIntelligence?: MarketIntelligenceData;
    dueDiligenceGuidance?: DueDiligenceGuidance;
  };
  insights: {
    marketBenchmarks: any;
    competitiveAnalysis: any;
    riskFactors: string[];
    opportunities: string[];
  };
  metadata: {
    processingTime: number;
    servicesUsed: string[];
    confidence: number;
  };
}

export interface ProgressCallback {
  (message: string, progress: number): void;
}

class GoogleCloudService {
  private readonly config: typeof googleCloudConfig;
  private readonly services: GoogleCloudServices;
  private readonly serviceHealth: Map<string, ServiceHealth>;
  private readonly enabledServices: Set<string>;

  constructor() {
    this.config = googleCloudConfig;
    this.serviceHealth = new Map();
    this.enabledServices = new Set([
      "gemini",
      "documentAI",
      "bigQuery",
      "agentBuilder",
    ]);

    // Initialize services
    this.services = {
      gemini: geminiService,
      documentAI: documentAIService,
      bigQuery: bigQueryService,
      agentBuilder: agentBuilderService,
    };

    this.initializeServices();
  }

  // Service orchestration methods
  async processCompleteAnalysis(
    files: File[],
    userId: string,
    progressCallback?: ProgressCallback
  ): Promise<ProcessingPipeline> {
    const startTime = Date.now();
    const servicesUsed: string[] = [];

    try {
      progressCallback?.("Initializing Google Cloud services...", 5);

      // Step 1: Document Processing
      progressCallback?.("Processing documents with Document AI...", 15);
      const processedDocuments = await this.processDocuments(
        files,
        progressCallback
      );
      servicesUsed.push("documentAI");

      // Step 2: AI Analysis with Gemini
      progressCallback?.("Performing AI analysis with Gemini Pro...", 50);

      // Convert documents to format expected by Gemini
      const documentInputs: DocumentInput[] = processedDocuments.map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        extractedContent: doc.extractedContent,
        extractedData: doc.extractedData,
        confidence: doc.confidence,
        size: doc.size,
      }));

      const analysis = await this.services.gemini.analyzeInvestmentOpportunity(
        documentInputs,
        (message: string, progress: number) =>
          progressCallback?.(message, 50 + progress * 0.3)
      );
      servicesUsed.push("gemini");

      // Step 3: Market Intelligence from BigQuery
      progressCallback?.("Gathering market intelligence...", 85);
      let marketData: MarketIntelligenceData;

      try {
        // Try to get market intelligence - fallback if service doesn't support it
        marketData = await this.getMarketIntelligence(
          analysis.startupName || "Unknown",
          analysis.industry || "Technology",
          analysis.stage || "Series A"
        );
        servicesUsed.push("bigQuery");
      } catch (error) {
        console.warn("Market intelligence gathering failed:", error);
        marketData = this.getFallbackMarketData();
      }

      // Step 4: Due Diligence Insights from Agent Builder
      progressCallback?.("Generating due diligence insights...", 95);
      let dueDiligenceGuidance: DueDiligenceGuidance;

      try {
        dueDiligenceGuidance =
          await this.services.agentBuilder.provideDueDiligenceGuidance({
            startupName: analysis.startupName,
            industry: analysis.industry,
            stage: analysis.stage,
            recommendation: analysis.recommendation,
          });
        servicesUsed.push("agentBuilder");
      } catch (error) {
        console.warn("Due diligence guidance failed:", error);
        dueDiligenceGuidance = this.getFallbackDueDiligence();
      }

      // Step 5: Store results (if BigQuery supports it)
      try {
        if (this.services.bigQuery.storeAnalysisResults) {
          await this.services.bigQuery.storeAnalysisResults(analysis);
        }
      } catch (error) {
        console.warn("Failed to store analysis results:", error);
        // Don't fail the entire process
      }

      const processingTime = Date.now() - startTime;
      progressCallback?.("Analysis complete!", 100);

      return {
        documents: processedDocuments,
        analysis: {
          ...analysis,
          marketIntelligence: marketData,
          dueDiligenceGuidance,
        },
        insights: {
          marketBenchmarks: marketData.benchmarks,
          competitiveAnalysis: marketData.competitors,
          riskFactors: marketData.riskFactors,
          opportunities: marketData.opportunities,
        },
        metadata: {
          processingTime,
          servicesUsed,
          confidence: this.calculateOverallConfidence(analysis, marketData),
        },
      };
    } catch (error) {
      console.error("Complete analysis processing failed:", error);
      throw new Error(
        `Google Cloud processing failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async processDocuments(
    files: File[],
    progressCallback?: ProgressCallback
  ): Promise<DocumentAIResult[]> {
    const processedDocs: DocumentAIResult[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const baseProgress = (i / totalFiles) * 30; // 30% allocated for document processing

      try {
        // ✅ FIXED: Explicitly typed callback parameters
        const result = await this.services.documentAI.processDocument(
          file,
          this.getDocumentType(file),
          (message: string, progress: number) => {
            const totalProgress =
              baseProgress + (progress / 100) * (30 / totalFiles);
            progressCallback?.(message, totalProgress);
          }
        );

        processedDocs.push(result);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        // Continue with other files
      }
    }

    return processedDocs;
  }

  // Market intelligence gathering with fallback
  private async getMarketIntelligence(
    companyName: string,
    industry: string,
    stage: string
  ): Promise<MarketIntelligenceData> {
    try {
      // Try BigQuery service methods if they exist
      const bigQuery = this.services.bigQuery as any;

      let benchmarks, competitors;

      if (bigQuery.getMarketBenchmarks) {
        benchmarks = await bigQuery.getMarketBenchmarks(industry, stage);
      } else {
        benchmarks = this.getFallbackBenchmarks(industry, stage);
      }

      if (bigQuery.getCompetitiveIntelligence) {
        competitors = await bigQuery.getCompetitiveIntelligence(
          companyName,
          industry
        );
      } else {
        competitors = this.getFallbackCompetitors();
      }

      return {
        benchmarks,
        competitors: competitors.competitors || competitors,
        riskFactors: competitors.threats || [
          "Market competition",
          "Technology risks",
          "Execution challenges",
        ],
        opportunities: [
          "Market expansion",
          "Technology leadership",
          "Strategic partnerships",
        ],
        gatheringDate: new Date().toISOString(),
      };
    } catch (error) {
      console.warn(
        "Market intelligence API failed, using fallback data:",
        error
      );
      return this.getFallbackMarketData();
    }
  }

  // Service health monitoring
  async checkServiceHealth(): Promise<ServiceHealth[]> {
    const healthChecks = await Promise.allSettled([
      this.checkGeminiHealth(),
      this.checkDocumentAIHealth(),
      this.checkBigQueryHealth(),
      this.checkAgentBuilderHealth(),
    ]);

    const results = healthChecks.map((result, index) => {
      const serviceName = ["gemini", "documentAI", "bigQuery", "agentBuilder"][
        index
      ];

      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          service: serviceName,
          status: "down" as const,
          lastCheck: new Date().toISOString(),
          error: result.reason?.message || "Health check failed",
        };
      }
    });

    // Update service health cache
    results.forEach((health) => {
      this.serviceHealth.set(health.service, health);
    });

    return results;
  }

  // Configuration management
  getConfiguration(): CloudConfiguration {
    return {
      projectId: this.config.projectId,
      location: this.config.location,
      environment: this.getEnvironment(),
      services: {
        enabled: Array.from(this.enabledServices),
        disabled: this.getDisabledServices(),
      },
    };
  }

  async enableService(serviceName: string): Promise<boolean> {
    try {
      if (this.services[serviceName as keyof GoogleCloudServices]) {
        this.enabledServices.add(serviceName);
        console.log(`✅ Service ${serviceName} enabled`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to enable service ${serviceName}:`, error);
      return false;
    }
  }

  async disableService(serviceName: string): Promise<boolean> {
    try {
      this.enabledServices.delete(serviceName);
      console.log(`⏸️ Service ${serviceName} disabled`);
      return true;
    } catch (error) {
      console.error(`Failed to disable service ${serviceName}:`, error);
      return false;
    }
  }

  // Analytics and monitoring
  getServiceMetrics(): Record<string, any> {
    return {
      totalServices: Object.keys(this.services).length,
      enabledServices: this.enabledServices.size,
      healthyServices: Array.from(this.serviceHealth.values()).filter(
        (h) => h.status === "healthy"
      ).length,
      averageLatency: this.calculateAverageLatency(),
      lastHealthCheck: this.getLastHealthCheckTime(),
    };
  }

  // Private helper methods
  private async initializeServices(): Promise<void> {
    try {
      console.log("🚀 Initializing Google Cloud services...");

      // Validate configuration
      if (!this.config.projectId) {
        console.warn(
          "Google Cloud project ID not configured - using simulation mode"
        );
      }

      // Check service health on initialization
      await this.checkServiceHealth();

      console.log("✅ Google Cloud services initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Google Cloud services:", error);
    }
  }

  private getDocumentType(file: File): DocumentType {
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

  private calculateOverallConfidence(
    analysis: GeminiAnalysisResult,
    marketData: MarketIntelligenceData
  ): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on data quality
    if (analysis.recommendation?.score) {
      confidence += 0.2;
    }

    if (marketData.benchmarks?.sample_size > 100) {
      confidence += 0.1;
    }

    if (marketData.competitors?.length > 3) {
      confidence += 0.1;
    }

    // Cross-validation boost
    if (analysis.crossDocumentInsights?.length > 0) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private async checkGeminiHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      const isHealthy = await this.services.gemini.healthCheck();
      const latency = Date.now() - startTime;

      return {
        service: "gemini",
        status: isHealthy ? "healthy" : "degraded",
        latency,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        service: "gemini",
        status: "down",
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async checkDocumentAIHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      const isHealthy = await this.services.documentAI.healthCheck();
      const latency = Date.now() - startTime;

      return {
        service: "documentAI",
        status: isHealthy ? "healthy" : "degraded",
        latency,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        service: "documentAI",
        status: "down",
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async checkBigQueryHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      const isHealthy = await this.services.bigQuery.healthCheck();
      const latency = Date.now() - startTime;

      return {
        service: "bigQuery",
        status: isHealthy ? "healthy" : "degraded",
        latency,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        service: "bigQuery",
        status: "down",
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async checkAgentBuilderHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      const isHealthy = await this.services.agentBuilder.healthCheck();
      const latency = Date.now() - startTime;

      return {
        service: "agentBuilder",
        status: isHealthy ? "healthy" : "degraded",
        latency,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        service: "agentBuilder",
        status: "down",
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private getFallbackMarketData(): MarketIntelligenceData {
    return {
      benchmarks: this.getFallbackBenchmarks("Technology", "Series A"),
      competitors: this.getFallbackCompetitors(),
      riskFactors: [
        "Market competition risks",
        "Technology scalability challenges",
        "Team execution capabilities",
        "Economic conditions impact",
      ],
      opportunities: [
        "Market expansion potential",
        "Technology differentiation",
        "Strategic partnership opportunities",
        "International market entry",
      ],
      gatheringDate: new Date().toISOString(),
    };
  }

  private getFallbackBenchmarks(industry: string, stage: string) {
    return {
      avg_growth: 150,
      median_valuation: 10000000,
      avg_burn: 50000,
      sample_size: 100,
      industry,
      stage,
    };
  }

  private getFallbackCompetitors() {
    return [
      {
        name: "CompetitorA",
        stage: "Series B",
        funding: 15000000,
        similarity_score: 0.7,
      },
      {
        name: "CompetitorB",
        stage: "Series A",
        funding: 8000000,
        similarity_score: 0.6,
      },
    ];
  }

  private getFallbackDueDiligence(): DueDiligenceGuidance {
    return {
      steps: [
        "Financial verification and audit",
        "Market validation analysis",
        "Team background checks",
        "Technology assessment",
        "Legal compliance review",
      ],
      recommendations: [
        "Conduct detailed financial analysis",
        "Validate market assumptions",
        "Assess competitive positioning",
        "Review intellectual property",
      ],
      riskFactors: [
        "Market timing risks",
        "Execution challenges",
        "Competitive threats",
        "Technology risks",
      ],
      nextActions: [
        "Schedule management presentation",
        "Request financial documentation",
        "Conduct reference checks",
        "Perform market research",
      ],
    };
  }

  // ✅ FIXED: Safe environment detection
  private getEnvironment(): "development" | "staging" | "production" {
    try {
      // Safe way to access Vite environment variables
      const envMode =
        typeof import.meta !== "undefined" && import.meta.env
          ? import.meta.env.MODE
          : "development";

      if (envMode === "production") return "production";
      if (envMode === "staging") return "staging";
      return "development";
    } catch (error) {
      // Fallback if import.meta is not available
      console.warn(
        "Could not detect environment mode, defaulting to development"
      );
      return "development";
    }
  }

  private getDisabledServices(): string[] {
    const allServices = Object.keys(this.services);
    return allServices.filter((service) => !this.enabledServices.has(service));
  }

  private calculateAverageLatency(): number {
    const healthData = Array.from(this.serviceHealth.values());
    const latencies = healthData
      .filter((h) => h.latency)
      .map((h) => h.latency!);

    if (latencies.length === 0) return 0;
    return latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
  }

  private getLastHealthCheckTime(): string {
    const healthData = Array.from(this.serviceHealth.values());
    if (healthData.length === 0) return "Never";

    const lastCheck = healthData.reduce((latest, current) => {
      return new Date(current.lastCheck) > new Date(latest)
        ? current.lastCheck
        : latest;
    }, "1970-01-01T00:00:00.000Z");

    return lastCheck;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const healthResults = await this.checkServiceHealth();
      const healthyServices = healthResults.filter(
        (h) => h.status === "healthy"
      ).length;
      return healthyServices >= 2; // At least 2 services should be healthy
    } catch (error) {
      console.error("Google Cloud service health check failed:", error);
      return false;
    }
  }
}

export default new GoogleCloudService();
export { GoogleCloudService };
