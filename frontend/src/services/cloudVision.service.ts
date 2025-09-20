import { googleCloudConfig } from "@/config/googleCloud";

// Types for Cloud Vision
interface VisionAnalysisResult {
  extractedText: string;
  detectedObjects: DetectedObject[];
  detectedLogos: DetectedLogo[];
  charts: ChartObject[];
  confidence: number;
  processingTime: number;
}

interface DetectedObject {
  name: string;
  score: number;
  boundingPoly?: {
    vertices: Array<{ x: number; y: number }>;
  };
}

interface DetectedLogo {
  description: string;
  score: number;
  boundingPoly?: {
    vertices: Array<{ x: number; y: number }>;
  };
}

interface ChartObject {
  type: "chart" | "graph" | "diagram";
  name: string;
  score: number;
  location: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface TextAnnotation {
  description: string;
  score: number;
  boundingPoly?: any;
}

class CloudVisionService {
  private readonly isEnabled: boolean;
  private readonly config: typeof googleCloudConfig;

  constructor() {
    this.config = googleCloudConfig;
    this.isEnabled = this.config.cloudVision.enabled;

    if (!this.isEnabled) {
      console.warn("⚠️ Cloud Vision not enabled - using fallback analysis");
    }
  }

  async analyzeDocument(
    imageBuffer: ArrayBuffer,
    documentType: string
  ): Promise<VisionAnalysisResult> {
    const startTime = Date.now();

    try {
      if (!this.isEnabled) {
        return this.getFallbackAnalysis(documentType, startTime);
      }

      // For frontend, we'll simulate Vision API calls
      // In production, this would call your backend API
      const result = await this.simulateVisionAnalysis(
        imageBuffer,
        documentType
      );

      return {
        ...result,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Cloud Vision analysis failed:", error);
      throw new Error(
        `Vision analysis failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async analyzeDocumentFromFile(
    file: File,
    documentType: string
  ): Promise<VisionAnalysisResult> {
    try {
      // Convert file to array buffer
      const arrayBuffer = await this.fileToArrayBuffer(file);
      return this.analyzeDocument(arrayBuffer, documentType);
    } catch (error) {
      console.error("Failed to process file for vision analysis:", error);
      throw new Error(
        `File processing failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async extractTextFromImage(imageBuffer: ArrayBuffer): Promise<string> {
    try {
      const result = await this.analyzeDocument(imageBuffer, "text-extraction");
      return result.extractedText;
    } catch (error) {
      console.error("Text extraction failed:", error);
      return "";
    }
  }

  async detectChartsAndGraphs(
    imageBuffer: ArrayBuffer
  ): Promise<ChartObject[]> {
    try {
      const result = await this.analyzeDocument(imageBuffer, "chart-detection");
      return result.charts;
    } catch (error) {
      console.error("Chart detection failed:", error);
      return [];
    }
  }

  // Private helper methods
  private async simulateVisionAnalysis(
    imageBuffer: ArrayBuffer,
    documentType: string
  ): Promise<Omit<VisionAnalysisResult, "processingTime">> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate mock analysis based on document type
    const mockAnalysis = this.generateMockAnalysis(documentType);

    return {
      extractedText: mockAnalysis.text,
      detectedObjects: mockAnalysis.objects,
      detectedLogos: mockAnalysis.logos,
      charts: this.detectCharts(mockAnalysis.objects),
      confidence: this.calculateVisionConfidence(mockAnalysis),
    };
  }

  private generateMockAnalysis(documentType: string) {
    const analyses = {
      pitchDeck: {
        text: "TechStartup Inc - AI-Powered Analytics Platform. Problem: Data analysis inefficiencies. Solution: Advanced AI algorithms. Market: $5.2B TAM. Team: Experienced founders. Traction: 150% growth.",
        objects: [
          { name: "Chart", score: 0.95 },
          { name: "Text", score: 0.98 },
          { name: "Logo", score: 0.85 },
          { name: "Graph", score: 0.9 },
        ],
        logos: [{ description: "TechStartup Inc", score: 0.85 }],
      },
      financialModel: {
        text: "Revenue Model: SaaS subscription. MRR: $50K. Growth: 15% MoM. Burn Rate: $25K/month. Runway: 18 months. CAC: $150. LTV: $2400.",
        objects: [
          { name: "Table", score: 0.92 },
          { name: "Chart", score: 0.88 },
          { name: "Number", score: 0.96 },
        ],
        logos: [],
      },
      marketResearch: {
        text: "Total Addressable Market: $5.2B. Serviceable Addressable Market: $1.1B. Competition: Fragmented market. Trends: AI adoption growing 40% YoY.",
        objects: [
          { name: "Diagram", score: 0.87 },
          { name: "Chart", score: 0.91 },
          { name: "Graph", score: 0.89 },
        ],
        logos: [],
      },
    };

    return (
      analyses[documentType as keyof typeof analyses] || analyses["pitchDeck"]
    );
  }

  private detectCharts(objects: DetectedObject[]): ChartObject[] {
    return objects
      .filter(
        (obj) =>
          obj.name.toLowerCase().includes("chart") ||
          obj.name.toLowerCase().includes("graph") ||
          obj.name.toLowerCase().includes("diagram")
      )
      .map((obj) => ({
        type: this.getChartType(obj.name),
        name: obj.name,
        score: obj.score,
        location: {
          x: Math.floor(Math.random() * 800),
          y: Math.floor(Math.random() * 600),
          width: Math.floor(Math.random() * 200) + 100,
          height: Math.floor(Math.random() * 150) + 75,
        },
      }));
  }

  private getChartType(name: string): "chart" | "graph" | "diagram" {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("chart")) return "chart";
    if (lowerName.includes("graph")) return "graph";
    return "diagram";
  }

  private calculateVisionConfidence(analysis: any): number {
    let confidence = 0.5; // Base confidence

    // Text quality boost
    if (analysis.text && analysis.text.length > 100) {
      confidence += 0.2;
    }

    // Object detection boost
    if (analysis.objects && analysis.objects.length > 0) {
      const avgScore =
        analysis.objects.reduce((sum: number, obj: any) => sum + obj.score, 0) /
        analysis.objects.length;
      confidence += avgScore * 0.3;
    }

    // Logo detection boost
    if (analysis.logos && analysis.logos.length > 0) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  }

  private getFallbackAnalysis(
    documentType: string,
    startTime: number
  ): VisionAnalysisResult {
    const mockAnalysis = this.generateMockAnalysis(documentType);

    return {
      extractedText: mockAnalysis.text,
      detectedObjects: mockAnalysis.objects,
      detectedLogos: mockAnalysis.logos,
      charts: this.detectCharts(mockAnalysis.objects),
      confidence: 0.7, // Fallback confidence
      processingTime: Date.now() - startTime,
    };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic functionality
      const testBuffer = new ArrayBuffer(100);
      await this.simulateVisionAnalysis(testBuffer, "test");
      return true;
    } catch (error) {
      console.error("Cloud Vision service health check failed:", error);
      return false;
    }
  }
}

export default new CloudVisionService();
export { CloudVisionService };
export type { VisionAnalysisResult, DetectedObject, ChartObject };
