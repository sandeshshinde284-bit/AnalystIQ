// ============================================================================
// PART 2: TYPE DEFINITIONS
// ============================================================================
//
// File: src/types/analysis.types.ts

/**
 * File upload state for a single document
 */
export type UploadState = "idle" | "uploading" | "success" | "error";

/**
 * Analysis processing status
 */
export type ProcessingStatus = "pending" | "processing" | "completed" | "error";

/**
 * Risk level classification
 */
export type RiskLevel = "low" | "medium" | "high";

/**
 * Investment recommendation
 */
export type RecommendationType =
  | "STRONG_BUY"
  | "BUY"
  | "HOLD"
  | "REVIEW"
  | "PASS";

/**
 * Represents a single uploaded document file
 */
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

/**
 * Upload state for all documents being tracked
 */
export interface UploadStates {
  pitchDeck: UploadState;
  financialModel: UploadState;
  founderProfiles: UploadState;
  marketResearch: UploadState;
  tractionData: UploadState;
}

/**
 * Validation error messages for each document
 */
export interface ValidationErrors {
  pitchDeck: string;
  financialModel: string;
  founderProfiles: string;
  marketResearch: string;
  tractionData: string;
}

/**
 * All uploaded files tracking
 */
export interface UploadedFiles {
  pitchDeck: File | null;
  financialModel: File | null;
  founderProfiles: File | null;
  marketResearch: File | null;
  tractionData: File | null;
}

/**
 * A single processing step in the analysis pipeline
 */
export interface ProcessingStep {
  id: string;
  title: string;
  status: ProcessingStatus;
  description?: string;
  errorMessage?: string;
  progress?: number;
}

/**
 * Source information for a metric
 */
export interface MetricSource {
  type: string;
  location: string;
  confidence: "high" | "medium" | "low";
  details?: string;
}

/**
 * Single key metric extracted from analysis
 */
export interface KeyMetric {
  label: string;
  value: string;
  source: MetricSource;
}

/**
 * Risk item in the risk assessment
 */
export interface RiskItem {
  type: string;
  level: RiskLevel;
  title: string;
  description: string;
  mitigation: string;
  impact: string;
}

/**
 * Investment recommendation with justification
 */
export interface InvestmentRecommendation {
  text: RecommendationType;
  score: number; // 0-100
  justification: string;
}

/**
 * Complete analysis result returned from API
 */
export interface AnalysisResult {
  startupName: string;
  analysisDate: string;
  industry?: string;
  stage?: string;
  recommendation: InvestmentRecommendation;
  keyMetrics: KeyMetric[];
  crossDocumentInsights?: Array<{
    type: string;
    title: string;
    description: string;
    confidence: string;
    status: string;
    source?: { documents: string[] };
  }>;
  riskAssessment?: RiskItem[];
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
  [key: string]: unknown; // Allow additional fields from API
}

/**
 * Form data for analysis submission
 */
export interface AnalysisFormData {
  category: string;
  files: UploadedFiles;
  transcriptText: string;
  uploadedFileCount: number;
}
