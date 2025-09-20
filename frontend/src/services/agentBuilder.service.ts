import { googleCloudConfig } from "@/config/googleCloud";

// Types for Agent Builder
export interface SearchQuery {
  input: string;
  context?: string;
}

export interface SearchResult {
  answer: string;
  sources: SearchSource[];
  confidence: "high" | "medium" | "low";
}

export interface SearchSource {
  title: string;
  snippet: string;
  uri: string;
}

export interface AnalysisData {
  startupName: string;
  industry?: string;
  stage?: string;
  recommendation: {
    text: string;
  };
}

export interface DueDiligenceGuidance {
  steps: string[];
  recommendations: string[];
  riskFactors: string[];
  nextActions: string[];
}

// Enhanced interface for investment insights
export interface InvestmentInsights {
  marketOpportunity: string;
  competitivePosition: string;
  riskProfile: string;
  recommendations: string[];
}

// Interface for knowledge base response
interface KnowledgeBaseResponse {
  results: Array<{
    document: {
      structData: {
        answer: string;
        title: string;
        snippet: string;
        uri: string;
      };
    };
  }>;
}

class AgentBuilderService {
  private readonly projectId: string;
  private readonly location: string;
  private readonly engineId: string;
  private readonly baseUrl: string;
  private readonly isEnabled: boolean;

  constructor() {
    this.projectId = googleCloudConfig.projectId;
    this.location = "global"; // Agent Builder is typically global
    this.engineId = googleCloudConfig.agentBuilder.engineId;
    this.baseUrl = `https://discoveryengine.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}`;
    this.isEnabled = !!this.engineId;

    if (!this.isEnabled) {
      console.warn(
        "⚠️ Agent Builder engine ID not configured - knowledge queries will use fallback responses"
      );
    } else {
      console.log("✅ Agent Builder service initialized");
    }
  }

  async queryInvestmentKnowledge(
    question: string,
    context?: string
  ): Promise<SearchResult> {
    try {
      if (!this.isEnabled) {
        return this.getFallbackResponse(question);
      }

      // In a real implementation, this would make an API call to Google Agent Builder
      // For now, we'll simulate the response
      const mockResponse = await this.simulateAgentBuilderQuery(
        question,
        context
      );

      return {
        answer: this.extractAnswer(mockResponse),
        sources: this.extractSources(mockResponse),
        confidence: this.calculateAnswerConfidence(mockResponse),
      };
    } catch (error) {
      console.error("Agent Builder query failed:", error);
      throw new Error(
        `Knowledge query failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async provideDueDiligenceGuidance(
    analysisData: AnalysisData
  ): Promise<DueDiligenceGuidance> {
    try {
      const context = this.buildAnalysisContext(analysisData);

      const guidance = await this.queryInvestmentKnowledge(
        "What additional due diligence steps should be taken for this investment opportunity?",
        context
      );

      return this.parseDueDiligenceResponse(guidance, analysisData);
    } catch (error) {
      console.error("Failed to provide due diligence guidance:", error);
      return this.getFallbackDueDiligenceGuidance(analysisData);
    }
  }

  async getIndustryInsights(
    industry: string,
    stage: string
  ): Promise<SearchResult> {
    const question = `What are the key investment considerations for ${stage} ${industry} startups?`;
    return this.queryInvestmentKnowledge(question);
  }

  async getRiskFactors(companyProfile: string): Promise<string[]> {
    const question = `What are the main risk factors for this type of investment: ${companyProfile}?`;
    const result = await this.queryInvestmentKnowledge(question);

    // Extract risk factors from the answer
    return this.parseRiskFactors(result.answer);
  }

  async getInvestmentInsights(
    analysisData: AnalysisData
  ): Promise<InvestmentInsights> {
    try {
      const context = this.buildAnalysisContext(analysisData);

      const [marketResult, competitiveResult, riskResult] = await Promise.all([
        this.queryInvestmentKnowledge(
          `Analyze the market opportunity for ${analysisData.startupName}`,
          context
        ),
        this.queryInvestmentKnowledge(
          `Assess competitive position for ${analysisData.startupName}`,
          context
        ),
        this.queryInvestmentKnowledge(
          `Identify investment risks for ${analysisData.startupName}`,
          context
        ),
      ]);

      return {
        marketOpportunity: marketResult.answer,
        competitivePosition: competitiveResult.answer,
        riskProfile: riskResult.answer,
        recommendations: this.extractRecommendations(
          marketResult.answer,
          analysisData
        ),
      };
    } catch (error) {
      console.error("Failed to get investment insights:", error);
      return this.getFallbackInvestmentInsights(analysisData);
    }
  }

  // Private helper methods
  private buildAnalysisContext(analysisData: AnalysisData): string {
    return `
      Startup: ${analysisData.startupName}
      Industry: ${analysisData.industry || "Technology"}
      Stage: ${analysisData.stage || "Early-stage"}
      Investment Recommendation: ${analysisData.recommendation.text}
    `.trim();
  }

  private async simulateAgentBuilderQuery(
    question: string,
    context?: string
  ): Promise<KnowledgeBaseResponse> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return mock response based on question type
    if (question.includes("due diligence")) {
      return {
        results: [
          {
            document: {
              structData: {
                answer:
                  "Recommended due diligence includes: financial audit, technical review, market validation, team assessment, legal compliance check, and competitive analysis.",
                title: "Investment Due Diligence Guide",
                snippet: "Comprehensive checklist for startup investments",
                uri: "https://example.com/due-diligence-guide",
              },
            },
          },
          {
            document: {
              structData: {
                answer:
                  "Additional steps: reference calls with customers, technical architecture review, IP portfolio analysis.",
                title: "Advanced Due Diligence",
                snippet: "Advanced investment validation techniques",
                uri: "https://example.com/advanced-dd",
              },
            },
          },
        ],
      };
    }

    if (question.includes("market opportunity")) {
      return {
        results: [
          {
            document: {
              structData: {
                answer:
                  "Market analysis shows strong growth potential with expanding TAM and increasing customer demand for AI-powered solutions.",
                title: "Market Opportunity Analysis",
                snippet:
                  "Comprehensive market sizing and opportunity assessment",
                uri: "https://example.com/market-analysis",
              },
            },
          },
        ],
      };
    }

    return {
      results: [
        {
          document: {
            structData: {
              answer:
                "Based on industry analysis, key considerations include market size, competitive landscape, and team execution capability.",
              title: "Investment Analysis Framework",
              snippet: "Framework for evaluating startup investments",
              uri: "https://example.com/investment-framework",
            },
          },
        },
      ],
    };
  }

  private extractAnswer(response: KnowledgeBaseResponse): string {
    return (
      response.results?.[0]?.document?.structData?.answer ||
      "No specific guidance found in knowledge base."
    );
  }

  private extractSources(response: KnowledgeBaseResponse): SearchSource[] {
    if (!response.results) return [];

    return response.results.map((result) => ({
      title: result.document?.structData?.title || "Unknown",
      snippet: result.document?.structData?.snippet || "",
      uri: result.document?.structData?.uri || "",
    }));
  }

  private calculateAnswerConfidence(
    response: KnowledgeBaseResponse
  ): "high" | "medium" | "low" {
    if (!response.results || response.results.length === 0) return "low";
    if (response.results.length >= 3) return "high";
    return "medium";
  }

  private parseDueDiligenceResponse(
    guidance: SearchResult,
    analysisData: AnalysisData
  ): DueDiligenceGuidance {
    // Parse the guidance answer into structured format
    const answer = guidance.answer;

    return {
      steps: this.extractDueDiligenceSteps(answer),
      recommendations: this.extractRecommendations(answer, analysisData),
      riskFactors: this.parseRiskFactors(answer), // ✅ FIXED: Using correct method name
      nextActions: this.extractNextActions(answer),
    };
  }

  private extractDueDiligenceSteps(answer: string): string[] {
    // Extract steps from the answer text
    const defaultSteps = [
      "Financial audit and verification",
      "Technical architecture review",
      "Market validation and sizing",
      "Team background verification",
      "Legal and compliance check",
      "Competitive landscape analysis",
      "Customer reference calls",
      "IP portfolio assessment",
    ];

    // In a real implementation, this would parse the actual answer
    return defaultSteps;
  }

  private extractRecommendations(
    answer: string,
    analysisData: AnalysisData
  ): string[] {
    return [
      `Focus on ${analysisData.industry || "technology"} market validation`,
      "Verify financial projections with third-party data",
      "Conduct thorough team reference checks",
      "Assess competitive differentiation strategy",
      "Evaluate technology scalability and IP protection",
      "Review customer acquisition and retention strategies",
    ];
  }

  // ✅ CORRECT METHOD NAME: parseRiskFactors (not extractRiskFactors)
  private parseRiskFactors(answer: string): string[] {
    // Extract risk factors from answer text
    const riskKeywords = [
      "risk",
      "concern",
      "challenge",
      "threat",
      "vulnerability",
    ];
    const sentences = answer.split(/[.!?]+/);

    return sentences
      .filter((sentence) =>
        riskKeywords.some((keyword) => sentence.toLowerCase().includes(keyword))
      )
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 10)
      .slice(0, 5); // Limit to top 5 risks
  }

  private extractNextActions(answer: string): string[] {
    return [
      "Schedule management presentation",
      "Request detailed financial model",
      "Conduct customer interviews",
      "Review legal documentation",
      "Perform technical deep dive",
      "Validate market assumptions",
      "Check competitive positioning",
    ];
  }

  private getFallbackResponse(question: string): SearchResult {
    return {
      answer:
        "Agent Builder service not configured. Using fallback investment guidance based on best practices.",
      sources: [],
      confidence: "low",
    };
  }

  private getFallbackDueDiligenceGuidance(
    analysisData: AnalysisData
  ): DueDiligenceGuidance {
    return {
      steps: [
        "Financial verification and audit",
        "Market size and opportunity validation",
        "Team background and reference checks",
        "Technical architecture review",
        "Competitive analysis update",
        "Legal and IP assessment",
        "Customer validation interviews",
      ],
      recommendations: [
        `Validate ${analysisData.industry || "target"} market assumptions`,
        "Verify revenue projections with actual data",
        "Assess team execution track record",
        "Review competitive positioning strategy",
      ],
      riskFactors: [
        "Market timing and adoption risks",
        "Competitive landscape changes",
        "Team execution capabilities",
        "Technology scalability challenges",
        "Financial runway adequacy",
      ],
      nextActions: [
        "Schedule detailed management presentation",
        "Request updated financial projections",
        "Conduct reference calls with customers",
        "Review all legal documentation",
        "Perform technical architecture assessment",
      ],
    };
  }

  private getFallbackInvestmentInsights(
    analysisData: AnalysisData
  ): InvestmentInsights {
    return {
      marketOpportunity: `Market opportunity for ${analysisData.startupName} requires additional research and validation.`,
      competitivePosition:
        "Competitive analysis needs deeper evaluation with current market data.",
      riskProfile:
        "Risk assessment requires comprehensive due diligence and market analysis.",
      recommendations: [
        "Conduct detailed market research",
        "Perform competitive analysis",
        "Validate business model assumptions",
        "Assess team capabilities",
      ],
    };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const testResult = await this.queryInvestmentKnowledge(
        "Test query for health check"
      );
      return !!testResult.answer;
    } catch (error) {
      console.error("Agent Builder health check failed:", error);
      return false;
    }
  }
}

export default new AgentBuilderService();
export { AgentBuilderService };
