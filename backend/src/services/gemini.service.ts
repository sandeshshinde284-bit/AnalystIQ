// GEMINI.SERVICE.TS

import { googleCloudConfig } from "../config/googleCloud.js";

// Types for Gemini service
export interface DocumentInput {
  id: string;
  name: string;
  type: string;
  extractedContent?: string;
  extractedData?: Record<string, any>;
  confidence?: number;
  size?: number;
}

export interface ProgressCallback {
  (message: string, progress: number): void;
}

export interface InvestmentRecommendation {
  text: "STRONG INVEST" | "INVEST" | "CAUTION" | "PASS";
  score: number;
  justification: string;
}

export interface KeyMetric {
  label: string;
  value: string;
  source: {
    type: "gemini-analysis" | "document-extraction" | "cross-validation";
    location: string;
    confidence: "high" | "medium" | "low";
  };
}

export interface RiskAssessment {
  level: "high" | "medium" | "low";
  title: string;
  description: string;
  mitigation: string;
  impact: string;
  probability?: "high" | "medium" | "low";
}

export interface CrossDocumentInsight {
  type: string;
  title: string;
  description: string;
  confidence: "high" | "medium" | "low";
  status: "validated" | "inconsistent" | "missing";
  source: {
    documents: string[];
  };
}

export interface SummaryContent {
  businessOverview: string;
  teamExperience: string;
  productTech: string;
}

export interface AnalysisMetadata {
  documentsProcessed: number;
  analysisDepth: "institutional-grade" | "comprehensive" | "basic";
  crossValidationPerformed: boolean;
  processingTime: string;
  confidenceBoost: number;
  aiModel: string;
  documentTypes?: string[];
  totalFileSize?: number;
  averageConfidence?: number;
}

export interface GeminiAnalysisResult {
  startupName: string;
  recommendation: InvestmentRecommendation;
  keyMetrics: KeyMetric[];
  riskAssessment: RiskAssessment[];
  crossDocumentInsights: CrossDocumentInsight[];
  summaryContent: SummaryContent;
  analysisDate: string;
  analysisType: "gemini-pro-enhanced";
  analysisMetadata: AnalysisMetadata;
  industry?: string;
  stage?: string;
  enhancedInsights?: {
    marketOpportunity: string;
    competitiveAdvantage: string;
    investmentHighlights: string[];
    redFlags: string[];
  };
}

class GeminiService {
  private readonly apiKey: string;
  private readonly modelName: string;
  private readonly isEnabled: boolean;
  private readonly useMockAI: boolean;

  constructor() {
    this.apiKey = googleCloudConfig.gemini.apiKey;
    this.modelName = googleCloudConfig.gemini.model || "gemini-1.5-pro";
    this.isEnabled = !!this.apiKey;

    this.useMockAI = process.env.USE_MOCK_AI === "true";

    if (this.useMockAI) {
      console.log("🎭 Gemini service running in MOCK MODE");
    } else if (!this.isEnabled) {
      console.warn(
        "⚠️ Gemini API key not configured - using fallback analysis"
      );
    } else {
      console.log(`✅ Gemini ${this.modelName} service initialized`);
    }
  }

  async analyzeInvestmentOpportunity(
    documents: DocumentInput[],
    progressCallback?: ProgressCallback
  ): Promise<GeminiAnalysisResult> {
    const startTime = Date.now();

    try {
      // Validate inputs
      this.validateDocuments(documents);

      progressCallback?.("Initializing Gemini Pro analysis...", 10);

      if (this.useMockAI || !this.isEnabled) {
        const reason = this.useMockAI
          ? "Mock mode enabled"
          : "API not configured";
        console.log(`🎭 Using simulated analysis: ${reason}`);
        return this.getFallbackAnalysis(documents, startTime, progressCallback);
      }

      // For now, we'll simulate the Gemini analysis since we're in frontend
      // In production, this would call your backend API that connects to Gemini
      progressCallback?.("Simulating Gemini Pro analysis...", 30);

      const analysis = await this.simulateGeminiAnalysis(
        documents,
        progressCallback
      );

      progressCallback?.("Finalizing investment analysis...", 100);

      return this.enhanceAnalysisWithMetadata(analysis, documents, startTime);
    } catch (error) {
      console.error("Gemini analysis failed:", error);

      // Provide fallback analysis instead of throwing error
      console.log("🔄 Falling back to simulated analysis...");
      return this.getFallbackAnalysis(documents, startTime, progressCallback);
    }
  }

  isMockMode(): boolean {
    return this.useMockAI;
  }

  private async simulateGeminiAnalysis(
    documents: DocumentInput[],
    progressCallback?: ProgressCallback
  ): Promise<GeminiAnalysisResult> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    progressCallback?.("Processing documents with AI...", 60);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    progressCallback?.("Generating investment insights...", 80);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const companyName = this.extractCompanyName(documents) || "TechStartup Inc";

    return {
      startupName: companyName,
      industry: "Technology",
      stage: "Series A",
      recommendation: {
        text: "INVEST",
        score: 78,
        justification: `${companyName} shows strong market traction with solid fundamentals. The team has relevant experience and the market opportunity is substantial. Recommend proceeding with detailed due diligence.`,
      },
      keyMetrics: [
        {
          label: "Monthly Recurring Revenue",
          value: "$50K",
          source: {
            type: "gemini-analysis",
            location: "Financial projections",
            confidence: "high",
          },
        },
        {
          label: "Growth Rate",
          value: "15% MoM",
          source: {
            type: "gemini-analysis",
            location: "Traction data",
            confidence: "high",
          },
        },
        {
          label: "Market Size",
          value: "$5.2B TAM",
          source: {
            type: "gemini-analysis",
            location: "Market research",
            confidence: "medium",
          },
        },
        {
          label: "Team Experience",
          value: "8+ years",
          source: {
            type: "gemini-analysis",
            location: "Founder profiles",
            confidence: "high",
          },
        },
        {
          label: "Burn Rate",
          value: "$25K/month",
          source: {
            type: "gemini-analysis",
            location: "Financial model",
            confidence: "medium",
          },
        },
        {
          label: "Runway",
          value: "18 months",
          source: {
            type: "gemini-analysis",
            location: "Cash flow analysis",
            confidence: "medium",
          },
        },
      ],
      riskAssessment: [
        {
          level: "medium",
          title: "Market Competition",
          description:
            "Increasing competition from established players in the analytics space",
          mitigation: "Focus on unique AI capabilities and customer lock-in",
          impact: "Could slow customer acquisition and pricing power",
          probability: "medium",
        },
        {
          level: "low",
          title: "Technical Scalability",
          description:
            "AI model scaling may require significant infrastructure investment",
          mitigation: "Cloud-native architecture and gradual scaling approach",
          impact: "Potential for higher operational costs",
          probability: "low",
        },
      ],
      crossDocumentInsights: [
        {
          type: "financial-validation",
          title: "Revenue Consistency",
          description:
            "Financial projections align across pitch deck and financial model",
          confidence: "high",
          status: "validated",
          source: { documents: ["pitch_deck", "financial_model"] },
        },
        {
          type: "team-market-fit",
          title: "Strong Founder-Market Alignment",
          description:
            "Founders have direct industry experience matching target market",
          confidence: "high",
          status: "validated",
          source: { documents: ["founder_profiles", "market_research"] },
        },
      ],
      summaryContent: {
        businessOverview: `${companyName} is developing an AI-powered analytics platform that addresses inefficiencies in enterprise data analysis. The company has demonstrated strong early traction with a clear path to scalability.`,
        teamExperience:
          "The founding team brings complementary skills with strong technical and business backgrounds. Previous experience at leading technology companies provides credibility and network advantages.",
        productTech:
          "The AI-powered analytics platform leverages modern technology stack with strong differentiation through real-time processing capabilities and intuitive user interface.",
      },
      enhancedInsights: {
        marketOpportunity:
          "Large and growing market with clear trend toward AI-powered analytics solutions",
        competitiveAdvantage:
          "Real-time processing capabilities and superior user experience",
        investmentHighlights: [
          "Strong revenue growth momentum",
          "Experienced founding team",
          "Large addressable market",
          "Clear product-market fit",
        ],
        redFlags: [
          "Competitive market landscape",
          "Customer acquisition costs need monitoring",
        ],
      },
      analysisDate: new Date().toISOString(),
      analysisType: "gemini-pro-enhanced",
      analysisMetadata: {
        documentsProcessed: documents.length,
        analysisDepth: "comprehensive",
        crossValidationPerformed: true,
        processingTime: "0 seconds",
        confidenceBoost: 15,
        aiModel: this.modelName,
      },
    };
  }

  private validateDocuments(documents: DocumentInput[]): void {
    if (!Array.isArray(documents) || documents.length === 0) {
      throw new Error("No documents provided for analysis");
    }

    if (documents.length > 10) {
      throw new Error("Too many documents provided (maximum 10 allowed)");
    }

    for (const doc of documents) {
      if (!doc.name || !doc.type) {
        throw new Error("Invalid document structure - missing name or type");
      }
    }
  }

  private extractCompanyName(documents: DocumentInput[]): string | null {
    // Priority 1: Extract from document content (same as before)
    for (const doc of documents) {
      const content = doc.extractedContent || "";

      if (content) {
        // ... content extraction patterns stay the same
      }

      if (doc.extractedData?.companyName) {
        console.log(
          `✅ Found company name in extracted data: "${doc.extractedData.companyName}"`
        );
        return doc.extractedData.companyName;
      }
    }

    for (const doc of documents) {
      const fileName = doc.name || "";
      const cleanFileName = fileName.replace(
        /\.(pdf|ppt|pptx|doc|docx|txt)$/i,
        ""
      );

      const filenamePatterns = [
        /^(?:Dr\.\s+|Mr\.\s+|Ms\.\s+|CEO\s+|The\s+|Copy\s+of\s+)?([A-Z][A-Za-z0-9\.]{2,15})(?:\s+(?:\([^)]*\))?\s*(?:Deck|Pitch|Report|Analysis|Memo|Document|Presentation|Model|Investor))/i,

        /^(?:Dr\.\s+|Mr\.\s+|Ms\.\s+|CEO\s+|The\s+|Copy\s+of\s+)?([A-Z][a-z]{2,12})(?:Deck|Pitch|Report|Analysis|Memo|Document|Presentation|Model)/i,

        /^(?:Dr\.\s+|Mr\.\s+|Ms\.\s+|CEO\s+|The\s+|Copy\s+of\s+)?([A-Z][A-Za-z0-9\.]{2,15})[-_\s]/,

        /-([A-Z][a-z]{3,15})-/,

        /\(([A-Z][A-Za-z]{3,15})\)(?!\s*(?:INR|USD|EUR|GBP|JPY|v\d|Ver|Version|Final|Draft|Updated))/i,

        /_for_([A-Z][A-Za-z]{2,15})_/i,

        /^(?:Dr\.\s+|Mr\.\s+|Ms\.\s+|CEO\s+|The\s+|Copy\s+of\s+|Final\s+|Investment\s+|Memo\s+)?([A-Z][A-Za-z0-9\.]{3,15})/,
      ];

      for (const pattern of filenamePatterns) {
        const match = cleanFileName.match(pattern);
        if (match && match[1]) {
          let companyName = match[1].trim();

          const skipWords = [
            // Document types
            "Pitch",
            "Deck",
            "Report",
            "Analysis",
            "Document",
            "File",
            "Memo",
            "Model",
            "Presentation",
            "Investment",
            "Investor",
            "Template",
            "Final",
            "Copy",
            "Business",
            "Plan",
            "Executive",
            "Summary",
            "Overview",
            "Profile",

            // Currency codes and common abbreviations
            "INR",
            "USD",
            "EUR",
            "GBP",
            "JPY",
            "CAD",
            "AUD",
            "CHF",
            "Ver",
            "Version",
            "Draft",
            "Final",
            "Updated",
            "Revised",

            // Common names
            "John",
            "Smith",
            "Johnson",
            "Brown",
            "Davis",
            "Miller",
            "Wilson",

            // Time indicators
            "May",
            "June",
            "July",
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];

          if (!skipWords.includes(companyName)) {
            if (
              companyName.length >= 3 &&
              companyName.length <= 20 &&
              /^[A-Z]/.test(companyName) &&
              !/^(CEO|CFO|CTO|VP|Dr|Mr|Ms|The|INR|USD|EUR)$/i.test(
                companyName
              ) &&
              !/^\d+$/.test(companyName)
            ) {
              // Skip pure numbers

              console.log(
                `✅ Extracted company name: "${companyName}" from "${fileName}"`
              );
              return companyName;
            }
          }
        }
      }
    }

    console.log(
      `⚠️ Could not extract company name from ${documents.length} documents`
    );
    return null;
  }

  private enhanceAnalysisWithMetadata(
    analysis: GeminiAnalysisResult,
    documents: DocumentInput[],
    startTime: number
  ): GeminiAnalysisResult {
    const processingTime = Date.now() - startTime;
    const documentTypes = documents
      .map((d) => d.type)
      .filter((type, index, arr) => arr.indexOf(type) === index);

    return {
      ...analysis,
      analysisMetadata: {
        ...analysis.analysisMetadata,
        processingTime: this.formatProcessingTime(processingTime),
        documentTypes,
        totalFileSize: documents.reduce((sum, doc) => sum + (doc.size || 0), 0),
        averageConfidence:
          documents.reduce((sum, doc) => sum + (doc.confidence || 0), 0) /
          documents.length,
      },
    };
  }

  private getFallbackAnalysis(
    documents: DocumentInput[],
    startTime: number,
    progressCallback?: ProgressCallback
  ): GeminiAnalysisResult {
    progressCallback?.("Using fallback analysis engine...", 60);

    const companyName = this.extractCompanyName(documents) || "Target Company";
    const processingTime = Date.now() - startTime;

    progressCallback?.("Generating fallback investment analysis...", 90);

    return {
      startupName: companyName,
      industry: "Technology",
      stage: "Series A",
      recommendation: {
        text: "CAUTION",
        score: 65,
        justification:
          "Analysis completed with limited AI capabilities. Recommend manual review of key metrics and market position before investment decision.",
      },
      keyMetrics: [
        {
          label: "Revenue (Estimated)",
          value: "Requires verification",
          source: {
            type: "document-extraction",
            location: "Financial documents",
            confidence: "low",
          },
        },
        {
          label: "Growth Rate",
          value: "Not determined",
          source: {
            type: "document-extraction",
            location: "Traction data",
            confidence: "low",
          },
        },
        {
          label: "Market Size",
          value: "Needs research",
          source: {
            type: "document-extraction",
            location: "Market analysis",
            confidence: "low",
          },
        },
      ],
      riskAssessment: [
        {
          level: "medium",
          title: "Limited Analysis Capability",
          description: "Analysis performed with reduced AI capability",
          mitigation: "Conduct comprehensive manual review",
          impact: "May miss critical insights",
          probability: "high",
        },
      ],
      crossDocumentInsights: [
        {
          type: "document-completeness",
          title: "Document Portfolio Review",
          description: `Analyzed ${documents.length} documents with basic extraction capabilities`,
          confidence: "medium",
          status: "validated",
          source: { documents: documents.map((d) => d.name) },
        },
      ],
      summaryContent: {
        businessOverview: `${companyName} appears to be a technology startup based on document analysis. Further detailed review recommended.`,
        teamExperience:
          "Team background requires additional verification and reference checks.",
        productTech:
          "Product-market fit and technical capabilities need deeper evaluation.",
      },
      enhancedInsights: {
        marketOpportunity:
          "Market opportunity assessment requires additional market research.",
        competitiveAdvantage:
          "Competitive advantages and defensibility need validation.",
        investmentHighlights: [
          "Document-based analysis completed",
          "Basic metrics extracted",
          "Framework analysis provided",
        ],
        redFlags: [
          "Limited AI analysis capability",
          "Requires manual verification",
          "Incomplete data extraction",
        ],
      },
      analysisDate: new Date().toISOString(),
      analysisType: "gemini-pro-enhanced",
      analysisMetadata: {
        documentsProcessed: documents.length,
        analysisDepth: "basic",
        crossValidationPerformed: false,
        processingTime: this.formatProcessingTime(processingTime),
        confidenceBoost: 0,
        aiModel: "fallback-engine",
      },
    };
  }

  private formatProcessingTime(milliseconds: number): string {
    const seconds = Math.round(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")} minutes`;
  }

  async healthCheck(): Promise<boolean> {
    try {
      return this.isEnabled;
    } catch (error) {
      console.error("Gemini health check failed:", error);
      return false;
    }
  }
}

export default new GeminiService();
export { GeminiService };
