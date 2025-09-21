//SRC - SERVICES - API.SERVICE.TS

import axios, {
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
  AxiosProgressEvent,
} from "axios";

// ✅ PROPER TYPE DEFINITION FOR PROGRESS CALLBACK
type ProgressCallback = (message: string, progress: number) => void;

const API_BASE_URL =
  process.env.VUE_APP_API_BASE_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for analysis
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ FIXED: Using InternalAxiosRequestConfig
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  console.log("🚀 API Request:", config.method?.toUpperCase(), config.url);
  return config;
});

// ✅ FIXED: Properly typed response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("✅ API Response:", response.status, response.config?.url);
    return response;
  },
  (error: AxiosError) => {
    console.error(
      "❌ API Error:",
      error.response?.status,
      error.config?.url,
      error.message
    );
    return Promise.reject(error);
  }
);

// ✅ INTERFACE FOR API RESPONSE
interface AnalysisResponse {
  startupName: string;
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
      details: string;
    };
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
  riskAssessment?: Array<{
    type: string;
    title: string;
    description: string;
    level: string;
    mitigation: string;
    impact: string;
  }>;
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
    confidenceBoost?: number;
  };
}

interface HealthResponse {
  status: string;
  timestamp: string;
  services: {
    [key: string]: string;
  };
}

export const analysisService = {
  async processAnalysis(
    files: File[],
    progressCallback: ProgressCallback
  ): Promise<AnalysisResponse> {
    const formData = new FormData();

    // Add files to form data
    files.forEach((file: File) => {
      formData.append("documents", file);
    });

    try {
      progressCallback("Uploading documents...", 10);

      const response: AxiosResponse<AnalysisResponse> = await apiClient.post(
        "/analysis",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          // ✅ FIXED: Using AxiosProgressEvent instead of ProgressEvent
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total) {
              const uploadProgress = Math.round(
                (progressEvent.loaded * 30) / progressEvent.total
              ); // 30% for upload
              progressCallback(`Uploading documents...`, 10 + uploadProgress);
            }
          },
        }
      );

      progressCallback("Analysis complete!", 100);
      return response.data;
    } catch (error: any) {
      console.error("Analysis service error:", error);

      if (error.response?.status === 413) {
        throw new Error(
          "Files too large. Please reduce file sizes and try again."
        );
      } else if (error.response?.status === 400) {
        throw new Error(
          error.response.data?.error || "Invalid file format or request."
        );
      } else if (error.code === "ECONNREFUSED") {
        throw new Error(
          "Backend server not running. Please start the backend server."
        );
      } else {
        throw new Error(
          error.response?.data?.error ||
            error.message ||
            "Analysis failed. Please try again."
        );
      }
    }
  },

  // Health check method
  async checkBackendHealth(): Promise<HealthResponse> {
    try {
      const response: AxiosResponse<HealthResponse> =
        await apiClient.get("/health");
      return response.data;
    } catch (error: any) {
      throw new Error("Backend server not reachable");
    }
  },
};

export default analysisService;

// ✅ EXPORT TYPES FOR USE IN OTHER FILES
export type { ProgressCallback, AnalysisResponse, HealthResponse };
