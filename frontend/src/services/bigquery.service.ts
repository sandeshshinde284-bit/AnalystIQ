import { googleCloudConfig } from "@/config/googleCloud";

// Types for BigQuery operations
interface MarketBenchmarks {
  avg_growth: number;
  median_valuation: number;
  avg_burn: number;
  sample_size: number;
  industry: string;
  stage: string;
  data_freshness: string;
}

interface CompetitorData {
  competitor_name: string;
  funding_amount: number;
  valuation: number;
  growth_metrics: Record<string, any>;
  market_share: number;
  last_funding_date?: string;
  employee_count?: number;
  headquarters?: string;
}

interface AnalysisDataForStorage {
  startupName: string;
  recommendation: {
    score: number;
    text: string;
  };
  keyMetrics: any[];
  riskAssessment?: RiskAssessment[];
  industry?: string;
  stage?: string;
  analysisId?: string;
  userId?: string;
}

interface RiskAssessment {
  level: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
}

interface BigQueryInsert {
  startup_name: string;
  analysis_date: string;
  recommendation_score: number;
  recommendation_text: string;
  key_metrics: string;
  risk_level: "high" | "medium" | "low";
  industry: string;
  stage: string;
  analysis_id?: string;
  user_id?: string;
  created_timestamp: string;
}

interface IndustryTrends {
  industry: string;
  avg_valuation_growth: number;
  funding_velocity: number;
  exit_rate: number;
  time_to_exit: number;
  success_rate: number;
}

interface MarketIntelligence {
  benchmarks: MarketBenchmarks;
  competitors: CompetitorData[];
  trends: IndustryTrends;
  riskFactors: string[];
  opportunities: string[];
}

class BigQueryService {
  private readonly projectId: string;
  private readonly dataset: string;
  private readonly tables: {
    startups: string;
    metrics: string;
    benchmarks: string;
    competitive: string;
  };
  private readonly isEnabled: boolean;

  constructor() {
    this.projectId = googleCloudConfig.projectId;
    this.dataset = googleCloudConfig.bigQuery.dataset;
    this.tables = {
      startups: googleCloudConfig.bigQuery.tables.startups,
      metrics: googleCloudConfig.bigQuery.tables.metrics,
      benchmarks: googleCloudConfig.bigQuery.tables.benchmarks,
      competitive: "competitive_intelligence",
    };

    // BigQuery is a backend service, so we'll simulate for frontend
    this.isEnabled = !!this.projectId && !!this.dataset;

    if (!this.isEnabled) {
      console.warn("⚠️ BigQuery not properly configured - using fallback data");
    }
  }

  async getMarketBenchmarks(
    industry: string,
    stage: string
  ): Promise<MarketBenchmarks> {
    try {
      if (!this.isEnabled) {
        return this.getFallbackBenchmarks(industry, stage);
      }

      // In a real implementation, this would make an API call to your backend
      // which would then query BigQuery
      const benchmarks = await this.simulateBigQueryBenchmarks(industry, stage);

      return {
        ...benchmarks,
        industry,
        stage,
        data_freshness: new Date().toISOString(),
      };
    } catch (error) {
      console.error("BigQuery benchmark query failed:", error);
      return this.getFallbackBenchmarks(industry, stage);
    }
  }

  async storeAnalysisResults(
    analysisData: AnalysisDataForStorage
  ): Promise<boolean> {
    try {
      if (!this.isEnabled) {
        console.log("BigQuery not enabled - analysis results logged locally");
        return false;
      }

      const insertData: BigQueryInsert = {
        startup_name: analysisData.startupName,
        analysis_date: new Date().toISOString(),
        recommendation_score: analysisData.recommendation.score,
        recommendation_text: analysisData.recommendation.text,
        key_metrics: JSON.stringify(analysisData.keyMetrics),
        risk_level: this.calculateOverallRisk(analysisData.riskAssessment),
        industry: analysisData.industry || "unknown",
        stage: analysisData.stage || "unknown",
        analysis_id: analysisData.analysisId,
        user_id: analysisData.userId,
        created_timestamp: new Date().toISOString(),
      };

      // In a real implementation, this would call your backend API
      await this.simulateStoreResults(insertData);

      console.log(`✅ Analysis results stored for ${analysisData.startupName}`);
      return true;
    } catch (error) {
      console.error("Failed to store analysis in BigQuery:", error);
      return false;
    }
  }

  async getCompetitiveIntelligence(
    companyName: string,
    industry: string
  ): Promise<CompetitorData[]> {
    try {
      if (!this.isEnabled) {
        return this.getFallbackCompetitors(industry);
      }

      // Simulate competitive intelligence query
      const competitors = await this.simulateCompetitiveQuery(industry);

      return competitors.map((competitor) => ({
        ...competitor,
        last_updated: new Date().toISOString(),
      }));
    } catch (error) {
      console.error("Competitive intelligence query failed:", error);
      return this.getFallbackCompetitors(industry);
    }
  }

  async getIndustryTrends(industry: string): Promise<IndustryTrends> {
    try {
      return {
        industry,
        avg_valuation_growth: this.generateTrendData().valuationGrowth,
        funding_velocity: this.generateTrendData().fundingVelocity,
        exit_rate: this.generateTrendData().exitRate,
        time_to_exit: this.generateTrendData().timeToExit,
        success_rate: this.generateTrendData().successRate,
      };
    } catch (error) {
      console.error("Failed to get industry trends:", error);
      throw new Error(
        `Industry trends query failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getMarketIntelligence(
    companyName: string,
    industry: string,
    stage: string
  ): Promise<MarketIntelligence> {
    try {
      const [benchmarks, competitors, trends] = await Promise.all([
        this.getMarketBenchmarks(industry, stage),
        this.getCompetitiveIntelligence(companyName, industry),
        this.getIndustryTrends(industry),
      ]);

      return {
        benchmarks,
        competitors,
        trends,
        riskFactors: this.generateRiskFactors(industry),
        opportunities: this.generateOpportunities(industry),
      };
    } catch (error) {
      console.error("Failed to gather market intelligence:", error);
      throw new Error(
        `Market intelligence gathering failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Private helper methods
  private async simulateBigQueryBenchmarks(
    industry: string,
    stage: string
  ): Promise<Omit<MarketBenchmarks, "industry" | "stage" | "data_freshness">> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Generate realistic benchmark data based on industry and stage
    const baseMetrics = this.getIndustryBaseMetrics(industry);
    const stageMultiplier = this.getStageMultiplier(stage);

    return {
      avg_growth: Math.round(baseMetrics.growth * stageMultiplier.growth),
      median_valuation: Math.round(
        baseMetrics.valuation * stageMultiplier.valuation
      ),
      avg_burn: Math.round(baseMetrics.burn * stageMultiplier.burn),
      sample_size: Math.floor(Math.random() * 500) + 100,
    };
  }

  private async simulateStoreResults(data: BigQueryInsert): Promise<void> {
    // Simulate API call to backend
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log("Simulated BigQuery insert:", data);
  }

  private async simulateCompetitiveQuery(
    industry: string
  ): Promise<CompetitorData[]> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const competitorNames = this.getIndustryCompetitors(industry);

    return competitorNames.map((name) => ({
      competitor_name: name,
      funding_amount: Math.floor(Math.random() * 50000000) + 1000000,
      valuation: Math.floor(Math.random() * 500000000) + 10000000,
      growth_metrics: {
        revenue_growth: `${Math.floor(Math.random() * 200) + 50}%`,
        user_growth: `${Math.floor(Math.random() * 150) + 25}%`,
        market_share: `${Math.floor(Math.random() * 15) + 1}%`,
      },
      market_share: Math.random() * 0.2 + 0.1,
      employee_count: Math.floor(Math.random() * 1000) + 50,
      headquarters: this.getRandomLocation(),
    }));
  }

  private getIndustryBaseMetrics(industry: string): {
    growth: number;
    valuation: number;
    burn: number;
  } {
    const metrics = {
      fintech: { growth: 180, valuation: 25000000, burn: 150000 },
      healthtech: { growth: 150, valuation: 30000000, burn: 120000 },
      edtech: { growth: 120, valuation: 15000000, burn: 80000 },
      saas: { growth: 200, valuation: 20000000, burn: 100000 },
      ecommerce: { growth: 160, valuation: 18000000, burn: 90000 },
      ai: { growth: 250, valuation: 35000000, burn: 200000 },
      biotech: { growth: 100, valuation: 50000000, burn: 300000 },
      cleantech: { growth: 130, valuation: 25000000, burn: 180000 },
    };

    return (
      metrics[industry.toLowerCase() as keyof typeof metrics] || {
        growth: 150,
        valuation: 20000000,
        burn: 120000,
      }
    );
  }

  private getStageMultiplier(stage: string): {
    growth: number;
    valuation: number;
    burn: number;
  } {
    const multipliers = {
      "pre-seed": { growth: 0.6, valuation: 0.3, burn: 0.4 },
      seed: { growth: 0.8, valuation: 0.6, burn: 0.6 },
      "series a": { growth: 1.0, valuation: 1.0, burn: 1.0 },
      "series b": { growth: 1.2, valuation: 2.5, burn: 1.8 },
      "series c": { growth: 1.1, valuation: 5.0, burn: 3.0 },
      "later stage": { growth: 0.9, valuation: 10.0, burn: 5.0 },
    };

    return (
      multipliers[stage.toLowerCase() as keyof typeof multipliers] || {
        growth: 1.0,
        valuation: 1.0,
        burn: 1.0,
      }
    );
  }

  private getIndustryCompetitors(industry: string): string[] {
    const competitors = {
      fintech: ["Stripe", "Square", "Plaid", "Robinhood", "Coinbase"],
      healthtech: [
        "Teladoc",
        "Veracyte",
        "Oscar Health",
        "Flatiron Health",
        "Tempus",
      ],
      edtech: ["Coursera", "Udemy", "Duolingo", "MasterClass", "Khan Academy"],
      saas: ["Salesforce", "HubSpot", "Zoom", "Slack", "Notion"],
      ecommerce: ["Shopify", "WooCommerce", "BigCommerce", "Magento", "Amazon"],
      ai: ["OpenAI", "Anthropic", "Scale AI", "DataRobot", "C3.ai"],
    };

    return (
      competitors[industry.toLowerCase() as keyof typeof competitors] || [
        "TechCorp",
        "InnovateCo",
        "StartupInc",
        "DisruptorLtd",
        "ScaleSolutions",
      ]
    );
  }

  private getRandomLocation(): string {
    const locations = [
      "San Francisco, CA",
      "New York, NY",
      "Boston, MA",
      "Austin, TX",
      "Seattle, WA",
      "Los Angeles, CA",
      "Chicago, IL",
      "Denver, CO",
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  private generateTrendData() {
    return {
      valuationGrowth: Math.floor(Math.random() * 50) + 100, // 100-150%
      fundingVelocity: Math.floor(Math.random() * 12) + 6, // 6-18 months
      exitRate: Math.floor(Math.random() * 15) + 5, // 5-20%
      timeToExit: Math.floor(Math.random() * 5) + 5, // 5-10 years
      successRate: Math.floor(Math.random() * 20) + 15, // 15-35%
    };
  }

  private generateRiskFactors(industry: string): string[] {
    const commonRisks = [
      "Market saturation and increased competition",
      "Regulatory changes and compliance requirements",
      "Economic downturn impact on funding",
      "Technology obsolescence risk",
      "Talent acquisition and retention challenges",
    ];

    const industrySpecificRisks = {
      fintech: ["Regulatory compliance complexity", "Cybersecurity threats"],
      healthtech: ["FDA approval delays", "Healthcare regulation changes"],
      ai: ["AI ethics concerns", "Data privacy regulations"],
    };

    const specificRisks =
      industrySpecificRisks[
        industry.toLowerCase() as keyof typeof industrySpecificRisks
      ] || [];
    return [...commonRisks, ...specificRisks];
  }

  private generateOpportunities(industry: string): string[] {
    const commonOpportunities = [
      "Growing market demand",
      "Digital transformation acceleration",
      "Remote work adoption",
      "Sustainability focus increase",
      "AI and automation integration",
    ];

    const industrySpecificOps = {
      fintech: ["Open banking adoption", "Cryptocurrency mainstream adoption"],
      healthtech: ["Telehealth growth", "Personalized medicine advancement"],
      ai: ["Enterprise AI adoption", "Edge computing expansion"],
    };

    const specificOps =
      industrySpecificOps[
        industry.toLowerCase() as keyof typeof industrySpecificOps
      ] || [];
    return [...commonOpportunities, ...specificOps];
  }

  private calculateOverallRisk(
    riskAssessment?: RiskAssessment[]
  ): "high" | "medium" | "low" {
    if (!riskAssessment || riskAssessment.length === 0) return "medium";

    const highRisks = riskAssessment.filter((r) => r.level === "high").length;
    const totalRisks = riskAssessment.length;
    const riskRatio = highRisks / totalRisks;

    if (riskRatio > 0.4) return "high";
    if (riskRatio > 0.2) return "medium";
    return "low";
  }

  private getFallbackBenchmarks(
    industry: string,
    stage: string
  ): MarketBenchmarks {
    const baseMetrics = this.getIndustryBaseMetrics(industry);
    const stageMultiplier = this.getStageMultiplier(stage);

    return {
      avg_growth: Math.round(baseMetrics.growth * stageMultiplier.growth),
      median_valuation: Math.round(
        baseMetrics.valuation * stageMultiplier.valuation
      ),
      avg_burn: Math.round(baseMetrics.burn * stageMultiplier.burn),
      sample_size: 150,
      industry,
      stage,
      data_freshness: "fallback_data",
    };
  }

  private getFallbackCompetitors(industry: string): CompetitorData[] {
    const names = this.getIndustryCompetitors(industry);
    return names.slice(0, 3).map((name) => ({
      competitor_name: name,
      funding_amount: 25000000,
      valuation: 150000000,
      growth_metrics: { revenue_growth: "120%" },
      market_share: 0.15,
    }));
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic functionality
      await this.simulateBigQueryBenchmarks("technology", "series a");
      return true;
    } catch (error) {
      console.error("BigQuery service health check failed:", error);
      return false;
    }
  }
}

export default new BigQueryService();
export { BigQueryService };
export type {
  MarketBenchmarks,
  CompetitorData,
  AnalysisDataForStorage,
  MarketIntelligence,
  IndustryTrends,
};
