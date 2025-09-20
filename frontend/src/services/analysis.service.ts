import geminiService from "./gemini.service";
import documentAIService from "./documentAI.service";
import { googleCloudConfig } from "@/config/googleCloud";

// For now, let's use a simplified approach without Firebase imports
// We'll add them back once the basic structure works

// Types for Analysis Service
export interface ProgressCallback {
  (message: string, progress: number): void;
}

export interface ProcessedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  extractedContent: string;
  extractedData: Record<string, any>;
  confidence: number;
  processedAt: string;
  fieldname?: string;
}

export interface AnalysisResult {
  analysisId: string;
  startupName: string;
  documents: ProcessedDocument[];
  createdAt: string;
  userId?: string;
  status: "processing" | "completed" | "failed";
  recommendation: {
    text: string;
    score: number;
    justification: string;
  };
  keyMetrics: Array<{
    label: string;
    value: string;
    source: any;
  }>;
  riskAssessment: Array<{
    level: string;
    title: string;
    description: string;
    mitigation: string;
    impact: string;
  }>;
  crossDocumentInsights: any[];
  summaryContent: {
    businessOverview: string;
    teamExperience: string;
    productTech: string;
  };
  analysisDate: string;
  analysisType: string;
  analysisMetadata: any;
}

export interface AnalysisInput {
  files: File[];
  userId?: string;
  analysisOptions?: {
    includeMarketAnalysis?: boolean;
    includeDueDiligence?: boolean;
    includeRiskAssessment?: boolean;
  };
}

export interface SavedAnalysis {
  analysisId: string;
  startupName: string;
  createdAt: string;
  status: string;
  recommendation?: any;
  keyMetrics?: any[];
  userId?: string;
}

class AnalysisService {
  private readonly maxFileSize = 50 * 1024 * 1024; // 50MB
  private readonly maxFiles = 10;
  private readonly supportedFileTypes = [
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  // Local storage for analyses (temporary)
  private analysisCache: Map<string, AnalysisResult> = new Map();

  async processAnalysis(
    files: File[],
    progressCallback?: ProgressCallback,
    userId?: string
  ): Promise<AnalysisResult> {
    try {
      // Validate input
      this.validateFiles(files);

      const analysisId = this.generateAnalysisId();

      // Step 1: Process documents
      progressCallback?.("Initializing document processing...", 5);
      const processedDocuments = await this.processDocuments(
        files,
        progressCallback
      );

      // Step 2: Perform AI analysis
      progressCallback?.("Starting AI analysis...", 50);

      // Convert to format expected by Gemini service
      const documentInputs = this.convertToDocumentInput(processedDocuments);

      const analysis = await geminiService.analyzeInvestmentOpportunity(
        documentInputs,
        (message: string, progress: number) =>
          progressCallback?.(message, 50 + progress * 0.4)
      );

      // Step 3: Create full analysis result
      progressCallback?.("Finalizing analysis results...", 95);
      const fullAnalysis: AnalysisResult = {
        ...analysis,
        analysisId,
        documents: processedDocuments,
        createdAt: new Date().toISOString(),
        userId,
        status: "completed",
      };

      // Step 4: Save results (locally for now)
      await this.saveAnalysisResults(analysisId, fullAnalysis);

      progressCallback?.("Analysis complete!", 100);

      return fullAnalysis;
    } catch (error) {
      console.error("Analysis service error:", error);
      throw new Error(
        `Analysis failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async processDocuments(
    files: File[],
    progressCallback?: ProgressCallback
  ): Promise<ProcessedDocument[]> {
    const processedDocs: ProcessedDocument[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const documentType = this.getDocumentType(file);

      const baseProgress = (i / totalFiles) * 40; // 40% for document processing

      try {
        const result = await documentAIService.processDocument(
          file,
          documentType,
          (message: string, progress: number) => {
            const totalProgress =
              baseProgress + (progress / 100) * (40 / totalFiles);
            progressCallback?.(message, totalProgress);
          }
        );

        // Add fieldname for compatibility
        const processedDoc: ProcessedDocument = {
          ...result,
          fieldname: this.getFieldName(file, documentType),
        };

        processedDocs.push(processedDoc);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        // Continue with other files
      }
    }

    return processedDocs;
  }

  private getDocumentType(
    file: File
  ):
    | "pitchDeck"
    | "financialModel"
    | "founderProfiles"
    | "marketResearch"
    | "tractionData"
    | "document" {
    const fileName = file.name.toLowerCase();

    // Enhanced document type detection
    if (fileName.includes("pitch") || fileName.includes("deck"))
      return "pitchDeck";
    if (
      fileName.includes("financial") ||
      fileName.includes("model") ||
      fileName.includes("finance")
    )
      return "financialModel";
    if (
      fileName.includes("founder") ||
      fileName.includes("team") ||
      fileName.includes("profile")
    )
      return "founderProfiles";
    if (
      fileName.includes("market") ||
      fileName.includes("research") ||
      fileName.includes("analysis")
    )
      return "marketResearch";
    if (
      fileName.includes("traction") ||
      fileName.includes("metrics") ||
      fileName.includes("growth")
    )
      return "tractionData";

    // Additional detection based on file properties
    if ((file as any).fieldname) {
      const fieldname = (file as any).fieldname;
      if (fieldname.includes("pitch")) return "pitchDeck";
      if (fieldname.includes("financial")) return "financialModel";
      if (fieldname.includes("founder")) return "founderProfiles";
      if (fieldname.includes("market")) return "marketResearch";
      if (fieldname.includes("traction")) return "tractionData";
    }

    return "document";
  }

  private getFieldName(file: File, documentType: string): string {
    // Return existing fieldname if available
    if ((file as any).fieldname) {
      return (file as any).fieldname;
    }

    // Generate fieldname based on document type
    const fieldNameMap: Record<string, string> = {
      pitchDeck: "pitchDeck",
      financialModel: "financialModel",
      founderProfiles: "founderProfiles",
      marketResearch: "marketResearch",
      tractionData: "tractionData",
      document: "document",
    };

    return fieldNameMap[documentType] || "document";
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
      size: doc.size,
    }));
  }

  private validateFiles(files: File[]): void {
    if (!files || files.length === 0) {
      throw new Error("No files provided for analysis");
    }

    if (files.length > this.maxFiles) {
      throw new Error(`Too many files. Maximum allowed: ${this.maxFiles}`);
    }

    for (const file of files) {
      // Check file size
      if (file.size > this.maxFileSize) {
        throw new Error(
          `File ${file.name} is too large. Maximum size: ${
            this.maxFileSize / 1024 / 1024
          }MB`
        );
      }

      // Check file type
      if (!this.supportedFileTypes.includes(file.type)) {
        console.warn(
          `File ${file.name} has unsupported type: ${file.type}. Proceeding anyway.`
        );
      }
    }
  }

  async saveAnalysisResults(
    analysisId: string,
    data: AnalysisResult
  ): Promise<void> {
    try {
      // For now, save to local cache
      this.analysisCache.set(analysisId, data);
      console.log("Analysis saved locally:", analysisId);
    } catch (error) {
      console.error("Failed to save analysis:", error);
      // Don't throw error - analysis can still be returned to user
    }
  }

  async getAnalysisById(analysisId: string): Promise<SavedAnalysis | null> {
    try {
      const analysis = this.analysisCache.get(analysisId);
      if (analysis) {
        return {
          analysisId: analysis.analysisId,
          startupName: analysis.startupName,
          createdAt: analysis.createdAt,
          status: analysis.status,
          recommendation: analysis.recommendation,
          keyMetrics: analysis.keyMetrics,
          userId: analysis.userId,
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to retrieve analysis:", error);
      throw error;
    }
  }

  async getUserAnalyses(userId: string): Promise<SavedAnalysis[]> {
    try {
      const userAnalyses = Array.from(this.analysisCache.values())
        .filter((analysis) => analysis.userId === userId)
        .map((analysis) => ({
          analysisId: analysis.analysisId,
          startupName: analysis.startupName,
          createdAt: analysis.createdAt,
          status: analysis.status,
          recommendation: analysis.recommendation,
          keyMetrics: analysis.keyMetrics,
          userId: analysis.userId,
        }));

      return userAnalyses;
    } catch (error) {
      console.error("Failed to get user analyses:", error);
      return [];
    }
  }

  async deleteAnalysis(analysisId: string): Promise<boolean> {
    try {
      const deleted = this.analysisCache.delete(analysisId);
      console.log(
        `Analysis deletion: ${
          deleted ? "success" : "not found"
        } - ${analysisId}`
      );
      return deleted;
    } catch (error) {
      console.error("Failed to delete analysis:", error);
      return false;
    }
  }

  generateAnalysisId(): string {
    return (
      "analysis_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  // Utility methods
  getSupportedFileTypes(): string[] {
    return [...this.supportedFileTypes];
  }

  getMaxFileSize(): number {
    return this.maxFileSize;
  }

  getMaxFiles(): number {
    return this.maxFiles;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // Test dependencies
      const geminiHealth = await geminiService.healthCheck();
      const documentAIHealth = await documentAIService.healthCheck();

      return geminiHealth && documentAIHealth;
    } catch (error) {
      console.error("Analysis service health check failed:", error);
      return false;
    }
  }
}

export default new AnalysisService();
export { AnalysisService };
