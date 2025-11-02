import axios, {
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
  AxiosProgressEvent,
} from "axios";
import { useAuthStore } from "@/stores/authStore";

type ProgressCallback = (message: string, progress: number) => void;

// Get Cloud Function URL from environment
// Format: https://region-project.cloudfunctions.net/function-name
const CLOUD_FUNCTION_URL =
  process.env.VUE_APP_CLOUD_FUNCTION_URL ||
  (() => {
    throw new Error(
      "CLOUD_FUNCTION_URL environment variable not set. Check your .env file."
    );
  })();

console.log("🌐 Using Cloud Function URL:", CLOUD_FUNCTION_URL);

// Create axios instance for Cloud Function
const apiClient = axios.create({
  timeout: 900000, // 15 minutes (Cloud Function can take time for large docs)
});

// Request logging interceptor
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  console.log("🚀 API Request:", config.method?.toUpperCase(), config.url);
  if (config.data instanceof FormData) {
    console.log("   📎 FormData with files (not logging full content)");
  }
  return config;
});

// Response logging interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("✅ API Response:", response.status, response.statusText);
    return response;
  },
  (error: AxiosError) => {
    console.error("❌ API Error:");
    console.error("   Status:", error.response?.status);
    console.error("   Message:", error.message);
    if (error.response?.data) {
      console.error("   Data:", error.response.data);
    }
    return Promise.reject(error);
  }
);

// Response interface (must match Cloud Function output from main.py)
interface AnalysisResponse {
  startupName: string;
  industry: string;
  sector?: string;
  stage: string;
  analysisDate: string;
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
      details?: string; // Optional - Cloud Function may not include
    };
  }>;
  summaryContent: {
    businessOverview: string;
    teamExperience: string;
    productTech: string;
  };
  riskAssessment?: Array<{
    type: string;
    level: string;
    title: string;
    description: string;
    mitigation: string;
    impact: string;
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
  documentsAnalyzed?: Array<{
    type: string;
    name: string;
  }>;
  analysisMetadata?: {
    aiModel: string;
    documentsProcessed: number;
    analysisDepth: string;
    crossValidationPerformed: boolean;
    processingTime: string;
  };

  memo_pdf_base64: string | null;
  public_data: any;

  // Allow additional fields from Cloud Function
  [key: string]: any;
}

interface HealthResponse {
  status: string;
  timestamp: string;
  service?: string;
  [key: string]: any;
}

export interface ErrorWithCode extends Error {
  code?: string;
}

// ============================================================================
// SECURITY ERROR MAP
// ============================================================================
const SECURITY_ERROR_MAP: Record<string, { icon: string; message: string }> = {
  RATE_LIMITED: {
    icon: "⏱️",
    message: "Too many requests. Please wait 60 seconds before trying again.",
  },
  INVALID_FILE_SIGNATURE: {
    icon: "❌",
    message: "File is corrupted or not a valid document. Please reupload.",
  },
  PERSONAL_DOCUMENT: {
    icon: "🔒",
    message:
      "Personal documents cannot be analyzed. Upload business documents only.",
  },
  NOT_BUSINESS_CONTENT: {
    icon: "📄",
    message:
      "This doesn't appear to be a business document. Try a different file.",
  },
  INSUFFICIENT_BUSINESS_CONTENT: {
    icon: "📊",
    message: "Document needs more business-related content.",
  },
  GEMINI_VALIDATION_FAILED: {
    icon: "🤖",
    message: "AI validation failed. Please try a different document.",
  },
  MIXED_PERSONAL_BUSINESS: {
    icon: "⚠️",
    message: "Document contains mixed personal and business content.",
  },
  NO_TEXT_EXTRACTED: {
    icon: "🔍",
    message: "Could not extract text. File may be corrupted or image-only.",
  },
  LIKELY_STRUCTURED_DOCUMENT: {
    icon: "📋",
    message:
      "This appears to be a form or ID. Please upload business documents.",
  },
};

// ============================================================================
// ✅ NEW: Rate Limit Handling Interceptor
// ============================================================================

interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

// Track retry attempts per URL
const retryAttempts = new Map<string, number>();

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("✅ API Response:", response.status, response.statusText);
    // Clear retry counter on success
    retryAttempts.delete(response.config.url || "");
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig;

    // ✅ HANDLE RATE LIMITING (429)
    if (error.response?.status === 429) {
      const url = config.url || "";
      const attempts = (retryAttempts.get(url) || 0) + 1;

      console.warn(`⏱️ Rate limited! Attempt ${attempts}`);

      if (attempts < defaultRetryConfig.maxRetries) {
        // Calculate wait time with exponential backoff
        const waitTime =
          defaultRetryConfig.delayMs *
          Math.pow(defaultRetryConfig.backoffMultiplier, attempts - 1);

        const retryAfterHeader = error.response.headers["Retry-After"];
        const actualWaitTime = retryAfterHeader
          ? parseInt(retryAfterHeader as string) * 1000
          : waitTime;

        console.log(`⏳ Waiting ${actualWaitTime}ms before retry...`);

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, actualWaitTime));

        // Store retry attempt
        retryAttempts.set(url, attempts);

        // Retry the request
        return apiClient.request(config);
      } else {
        console.error("❌ Max retries exceeded for rate limit");
        retryAttempts.delete(url);
        return Promise.reject(error);
      }
    }

    // ✅ LOG ALL OTHER ERRORS
    console.error("❌ API Error:");
    console.error("   Status:", error.response?.status);
    console.error("   Message:", error.message);
    if (error.response?.data) {
      console.error("   Data:", error.response.data);
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// ✅ NEW: Helper function to extract security error code
// ============================================================================

function extractSecurityErrorCode(errorData: any): string | null {
  // Check for error code field
  if (errorData?.code && SECURITY_ERROR_MAP[errorData.code]) {
    return errorData.code;
  }

  // Check details array
  if (errorData?.details && Array.isArray(errorData.details)) {
    for (const detail of errorData.details) {
      if (detail.error && SECURITY_ERROR_MAP[detail.error]) {
        return detail.error;
      }
    }
  }

  return null;
}

export const analysisService = {
  async processAnalysis(
    files: File[],
    category: string = "technology",
    progressCallback: ProgressCallback,
    transcriptText: string = "",
    weights?: any
  ): Promise<AnalysisResponse> {
    const formData = new FormData();

    // Add files to form data with "documents" field name
    files.forEach((file: File) => {
      console.log(
        `📎 Adding file: ${file.name} (${file.size} bytes, ${file.type})`
      );
      formData.append("documents", file);
    });

    formData.append("category", category);
    formData.append("sector", category);
    formData.append("transcriptText", transcriptText);

    formData.append("userId", getUserIdFromAuthStore());
    formData.append(
      "weights",
      JSON.stringify(
        weights || {
          founder: 25,
          market: 25,
          differentiation: 25,
          team: 25,
        }
      )
    );

    try {
      progressCallback("Uploading documents to Cloud Function...", 5);
      console.log("📤 Sending", files.length, "file(s) + category:", category);

      // Send to Cloud Function (use root endpoint /)
      // Do NOT manually set Content-Type - let axios handle it with boundary
      const response: AxiosResponse<AnalysisResponse> = await apiClient.post(
        CLOUD_FUNCTION_URL,
        formData,
        {
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total) {
              const uploadProgress = Math.round(
                (progressEvent.loaded * 20) / progressEvent.total
              );
              progressCallback(
                `Uploading documents... ${uploadProgress}%`,
                5 + uploadProgress
              );
            }
          },
        }
      );

      console.log("✅ Response received successfully");
      console.log("   Startup Name:", response.data.startupName);
      console.log("   Recommendation:", response.data.recommendation?.text);

      progressCallback("Processing complete!", 100);
      return response.data;
    } catch (error: any) {
      console.error("❌ Analysis failed");
      console.error("   Error:", error);

      // ✅ ENHANCED: Extract error response from backend
      const errorData = error.response?.data;
      const securityErrorCode = extractSecurityErrorCode(errorData);

      // ✅ IF IT'S A SECURITY ERROR, USE MAPPED MESSAGE
      if (securityErrorCode) {
        const errorInfo = SECURITY_ERROR_MAP[securityErrorCode];
        console.error(
          `   Security Error [${securityErrorCode}]:`,
          errorInfo.message
        );

        // ✅ FIX: ATTACH ERROR CODE TO ERROR OBJECT
        const errorObj: ErrorWithCode = new Error(errorInfo.message);
        errorObj.code = securityErrorCode;
        throw errorObj;
      }

      let errorMessage =
        errorData?.message ||
        errorData?.error ||
        error.message ||
        "Analysis failed. Please try again.";

      console.error("   Data:", errorData);

      // ✅ If backend returned validation details, extract first one
      if (
        errorData?.details &&
        Array.isArray(errorData.details) &&
        errorData.details.length > 0
      ) {
        const firstError = errorData.details[0];
        errorMessage = firstError.message || firstError.error || errorMessage;
        console.error("   Extracted from details:", errorMessage);
      }

      // ✅ If backend has validation_details, use that
      if (
        errorData?.validation_details &&
        Array.isArray(errorData.validation_details) &&
        errorData.validation_details.length > 0
      ) {
        const firstValidation = errorData.validation_details[0];
        errorMessage =
          firstValidation.description || firstValidation.reason || errorMessage;
        console.error("   Extracted from validation_details:", errorMessage);
      }

      if (error.response?.status === 400) {
        console.error("   Bad Request:", errorData?.details);
        throw new Error(errorMessage);
      } else if (error.response?.status === 413) {
        throw new Error("📦 Files too large. Please use files under 50MB.");
      } else if (error.response?.status === 429) {
        throw new Error("⏱️ Rate limited. Please wait before trying again.");
      } else if (error.code === "ECONNREFUSED") {
        throw new Error(
          "Cannot connect to Cloud Function. Check the URL: " +
            CLOUD_FUNCTION_URL
        );
      } else if (error.response?.status === 500) {
        console.error("   Server Error:", errorData?.error_type);
        throw new Error(errorMessage);
      } else {
        throw new Error(errorMessage);
      }
    }
  },

  async checkBackendHealth(): Promise<HealthResponse> {
    try {
      const healthUrl = CLOUD_FUNCTION_URL + "?health=true";

      console.log("🏥 Checking Cloud Function health at:", healthUrl);
      // Health check endpoint for Cloud Function
      const response: AxiosResponse<HealthResponse> = await apiClient.get(
        healthUrl,
        { timeout: 10000 }
      );

      console.log("✅ Cloud Function is healthy");
      return response.data;
    } catch (error: any) {
      console.error("❌ Health check failed:", error.message);
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        service: "Cloud Function - Investment Analysis",
        error: error.message || "Cloud Function not reachable",
      };
    }
  },

  getApiUrl(): string {
    return CLOUD_FUNCTION_URL;
  },
};

export default analysisService;
export type { ProgressCallback, AnalysisResponse, HealthResponse };

function getUserIdFromAuthStore(): string {
  const authStore = useAuthStore();
  const userId = authStore.getUserId;

  if (!userId) {
    console.warn("⚠️ No user ID - analysis won't be saved");
    return "anonymous";
  }

  console.log("✅ Sending userId:", userId);
  return userId;
}
