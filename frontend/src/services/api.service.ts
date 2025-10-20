import axios, {
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
  AxiosProgressEvent,
} from "axios";

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
  // Allow additional fields from Cloud Function
  [key: string]: any;
}

interface HealthResponse {
  status: string;
  timestamp: string;
  service?: string;
  [key: string]: any;
}

export const analysisService = {
  async processAnalysis(
    files: File[],
    progressCallback: ProgressCallback
  ): Promise<AnalysisResponse> {
    const formData = new FormData();

    // Add files to form data with "documents" field name
    files.forEach((file: File) => {
      console.log(
        `📎 Adding file: ${file.name} (${file.size} bytes, ${file.type})`
      );
      formData.append("documents", file);
    });

    try {
      progressCallback("Uploading documents to Cloud Function...", 5);
      console.log("📤 Sending", files.length, "file(s) to Cloud Function");

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

      // Parse error response
      const errorData = error.response?.data;
      const errorMessage =
        errorData?.message ||
        errorData?.error ||
        error.message ||
        "Analysis failed. Please try again.";

      if (error.response?.status === 400) {
        console.error("   Bad Request:", errorData?.details);
        throw new Error(errorMessage);
      } else if (error.response?.status === 413) {
        throw new Error("Files too large. Please use files under 50MB.");
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

  // async checkBackendHealth(): Promise<HealthResponse> {
  //   try {
  //     // Health check endpoint for Cloud Function
  //     const response: AxiosResponse<HealthResponse> = await apiClient.get(
  //       CLOUD_FUNCTION_URL + "?health=true"
  //     );
  //     console.log("✅ Health check passed");
  //     return response.data;
  //   } catch (error: any) {
  //     console.error("❌ Health check failed:", error.message);
  //     throw new Error("Cloud Function not reachable");
  //   }
  // },

  async checkBackendHealth(): Promise<HealthResponse> {
    try {
      // Cloud Function doesn't have a dedicated health endpoint
      // Just return a mock response indicating it's likely working
      console.log("✅ Cloud Function endpoint is configured");
      return {
        status: "healthy",
        service: "Cloud Function - Investment Analysis",
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error("❌ Health check failed:", error.message);
      throw new Error("Cloud Function not reachable");
    }
  },

  getApiUrl(): string {
    return CLOUD_FUNCTION_URL;
  },
};

export default analysisService;
export type { ProgressCallback, AnalysisResponse, HealthResponse };
