//ANALYSIS.SERVICE.TS

import geminiService from "../services/gemini.service.js";
import documentAIService from "../services/documentAI.service.js";
import { googleCloudConfig } from "../config/googleCloud.js";
import fetch from "node-fetch";

const AI_FUNCTION_URL =
  "https://analyze-document-631446553603.us-central1.run.app";

// For now, let's use a simplified approach without Firebase imports
// We'll add them back once the basic structure works

// Types for Analysis Service
export interface ProgressCallback {
  (message: string, progress: number): void;
}

// ADD THESE INTERFACES AT THE TOP
interface CloudFunctionResponse {
  status: "success" | "error";
  extracted_data?: {
    full_text: string;
    confidence: number;
    page_count: number;
    entities: any[];
    tables: any[];
    form_fields: any;
    key_value_pairs: any[];
  };
  ai_insights?: {
    document_type: string;
    summary: string;
    key_insights: string[];
    financial_metrics: any;
    risk_analysis: string;
    recommendations: string[];
    data_quality_score: number;
    confidence_level: string;
  };
  processing_info?: any;
  message?: string;
  error_type?: string;
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

// This should be in a shared type definition file, e.g., src/types/index.ts
export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  fieldname?: string; // Multer provides this
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
    files: UploadedFile[],
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
        // Spread the analysis from Gemini first
        ...analysis,

        // Add your specific properties
        analysisId,
        documents: processedDocuments,
        createdAt: new Date().toISOString(),
        status: "completed",

        // ✅ Conditionally add userId ONLY if it exists
        ...(userId && { userId }),
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
    files: UploadedFile[],
    progressCallback?: ProgressCallback
  ): Promise<ProcessedDocument[]> {
    const processedDocs: ProcessedDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const baseProgress = (i / files.length) * 40;

      try {
        progressCallback?.(
          `Processing ${file.originalname} with AI...`,
          baseProgress
        );

        // 🔥 NEW: Call your Cloud Function instead of local services
        const base64Content = file.buffer.toString("base64");

        const response = await fetch(AI_FUNCTION_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdf_content: base64Content }),
        });

        const aiResult = (await response.json()) as CloudFunctionResponse;

        if (aiResult.status === "success" && aiResult.extracted_data) {
          const processedDoc: ProcessedDocument = {
            id: `doc_${Date.now()}_${i}`,
            name: file.originalname,
            type: this.getDocumentType(file),
            size: file.size,
            extractedContent: aiResult.extracted_data.full_text || "",
            extractedData: aiResult.extracted_data,
            confidence: aiResult.extracted_data.confidence || 0.8,
            processedAt: new Date().toISOString(),
            fieldname: file.fieldname || "document",
          };

          processedDocs.push(processedDoc);
          progressCallback?.(
            `✅ Processed ${file.originalname}`,
            baseProgress + 30
          );
        } else {
          throw new Error(`AI processing failed: ${aiResult.message}`);
        }
      } catch (error) {
        console.error(`Failed to process ${file.originalname}:`, error);
        // Continue with other files
      }
    }

    return processedDocs;
  }

  private getDocumentType(
    file: UploadedFile
  ):
    | "pitchDeck"
    | "financialModel"
    | "founderProfiles"
    | "marketResearch"
    | "tractionData"
    | "document" {
    // ✅ FIX: Use 'originalname' instead of 'name'
    const fileName = file.originalname.toLowerCase();

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

    // Additional detection based on fieldname from multer
    if (file.fieldname) {
      const fieldname = file.fieldname.toLowerCase();
      if (fieldname.includes("pitch")) return "pitchDeck";
      if (fieldname.includes("financial")) return "financialModel";
      if (fieldname.includes("founder")) return "founderProfiles";
      if (fieldname.includes("market")) return "marketResearch";
      if (fieldname.includes("traction")) return "tractionData";
    }

    return "document";
  }

  private getFieldName(file: UploadedFile, documentType: string): string {
    // Return existing fieldname if available from multer
    if (file.fieldname) {
      return file.fieldname;
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

  private validateFiles(files: UploadedFile[]): void {
    if (!files || files.length === 0) {
      throw new Error("No files provided for analysis");
    }

    if (files.length > this.maxFiles) {
      throw new Error(`Too many files. Maximum allowed: ${this.maxFiles}`);
    }

    for (const file of files) {
      // Check file size (the 'size' property is the same)
      if (file.size > this.maxFileSize) {
        // ✅ FIX: Use 'originalname' for logging
        throw new Error(
          `File ${file.originalname} is too large. Maximum size: ${
            this.maxFileSize / 1024 / 1024
          }MB`
        );
      }

      // Check file type
      // ✅ FIX: Use 'mimetype' instead of 'type'
      if (!this.supportedFileTypes.includes(file.mimetype)) {
        console.warn(
          `File ${file.originalname} has unsupported type: ${file.mimetype}. Proceeding anyway.`
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
        // ✅ FIX: Use conditional spread for the optional userId
        return {
          analysisId: analysis.analysisId,
          startupName: analysis.startupName,
          createdAt: analysis.createdAt,
          status: analysis.status,
          recommendation: analysis.recommendation,
          keyMetrics: analysis.keyMetrics,
          ...(analysis.userId && { userId: analysis.userId }),
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
          // ✅ FIX: Use conditional spread inside the map function
          analysisId: analysis.analysisId,
          startupName: analysis.startupName,
          createdAt: analysis.createdAt,
          status: analysis.status,
          recommendation: analysis.recommendation,
          keyMetrics: analysis.keyMetrics,
          ...(analysis.userId && { userId: analysis.userId }),
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
