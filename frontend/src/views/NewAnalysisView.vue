<!-- C:\Google-Hack\Projects\AnalystIQ\frontend\src\views\NewAnalysisView.vue -->

<template>
  <div class="page-wrapper">
    <div class="container">
      <h1>AI Startup Investment Analysis</h1>
      <p class="subtitle">
        Upload startup documents for comprehensive investment analysis and due
        diligence
      </p>

      <!-- Backend Status Indicator -->
      <div
        v-if="backendStatus !== 'checking'"
        class="backend-status"
        :class="backendStatus"
      >
        <i
          :class="
            backendStatus === 'connected'
              ? 'ri-check-line'
              : 'ri-error-warning-line'
          "
        ></i>
        <span v-if="backendStatus === 'connected'"
          >🚀 AI Analysis Engine Ready</span
        >
        <span v-else
          >⚠️ Backend Disconnected - Please start backend server</span
        >
      </div>
      <div
        v-if="showWeightageModal"
        class="weightage-modal-overlay"
        @click="showWeightageModal = false"
      >
        <div class="weightage-modal-content" @click.stop>
          <button class="modal-close" @click="showWeightageModal = false">
            <i class="ri-close-line"></i>
          </button>

          <div class="weightage-customization">
            <h4 style="color: #00d4ff; margin-top: 30px">
              ⚙️ Customize Investment Weights
            </h4>

            <!-- Founder Weight -->
            <div class="weight-slider-group">
              <div class="weight-label">
                <span>Founder Profile</span>
                <span class="weight-value">{{ weights.founder }}%</span>
              </div>
              <input
                v-model.number="weights.founder"
                type="range"
                min="0"
                max="100"
                class="weight-slider"
              />
            </div>

            <!-- Market Weight -->
            <div class="weight-slider-group">
              <div class="weight-label">
                <span>Market Size</span>
                <span class="weight-value">{{ weights.market }}%</span>
              </div>
              <input
                v-model.number="weights.market"
                type="range"
                min="0"
                max="100"
                class="weight-slider"
              />
            </div>

            <!-- Differentiation Weight -->
            <div class="weight-slider-group">
              <div class="weight-label">
                <span>Differentiation</span>
                <span class="weight-value">{{ weights.differentiation }}%</span>
              </div>
              <input
                v-model.number="weights.differentiation"
                type="range"
                min="0"
                max="100"
                class="weight-slider"
              />
            </div>

            <!-- Team Weight -->
            <div class="weight-slider-group">
              <div class="weight-label">
                <span>Team & Traction</span>
                <span class="weight-value">{{ weights.team }}%</span>
              </div>
              <input
                v-model.number="weights.team"
                type="range"
                min="0"
                max="100"
                class="weight-slider"
              />
            </div>

            <!-- Total validation -->
            <div
              class="weight-total"
              :class="{
                valid: totalWeight === 100,
                invalid: totalWeight !== 100,
              }"
            >
              Total: {{ totalWeight }}%
              <span v-if="totalWeight === 100">✔ Valid</span>
              <span v-else>✗ Must equal 100%</span>
            </div>

            <button @click="resetWeights" class="reset-btn">
              Reset to Default (25% each)
            </button>
          </div>
          <p class="weightage-note">
            💡 Custom weights only affect this analysis. Defaults reset on next
            upload.
          </p>
        </div>
      </div>

      <form @submit.prevent="handleAnalysis">
        <!-- Enhanced Category Dropdown -->
        <div class="form-group">
          <label for="category">
            Startup Sector <span class="mandatory">*</span>
          </label>
          <div class="dropdown-wrapper glassmorphism glow-effect">
            <select
              id="category"
              v-model="selectedCategory"
              class="enhanced-select"
            >
              <option value="" selected disabled>
                🚀 Choose startup sector for evaluation
              </option>
              <option
                v-for="sector in STARTUP_SECTORS_LIST"
                :key="sector.value"
                :value="sector.value"
              >
                {{ sector.icon }} {{ sector.label }}
              </option>
            </select>
            <i class="dropdown-icon ri-arrow-down-s-line"></i>
          </div>
        </div>
        <button
          type="button"
          @click="showWeightageModal = true"
          class="customize-weights-btn"
        >
          <i class="ri-scales-line"></i>
          Customize Investment Weights
        </button>
        <!-- Primary Upload: Pitch Deck -->
        <div class="form-group">
          <label class="upload-section-title">
            <i class="ri-presentation-line"></i>
            Startup Pitch Deck <span class="mandatory">*</span>
          </label>
          <div class="upload-wrapper">
            <FileUploadZone
              :file="uploadedFiles.pitchDeck"
              :is-uploading="uploadStates.pitchDeck"
              accept=".pdf,.ppt,.pptx"
              placeholder="Drag and drop startup pitch deck here"
              @file-selected="
                (file: File) => handleFileUpload('pitchDeck', file)
              "
              @change-file="() => changeFile('pitchDeck')"
              :max-size="30"
              file-type="Pitch Deck"
            />
            <!-- Inline validation error -->
            <div v-if="validationErrors.pitchDeck" class="field-error">
              <i class="ri-error-warning-line"></i>
              {{ validationErrors.pitchDeck }}
            </div>
          </div>
        </div>

        <!-- Due Diligence Documents Section -->
        <div class="additional-documents">
          <h3 class="section-title">
            <i class="ri-folder-add-line"></i>
            Due Diligence Documents
            <span class="optional">
              (Optional - but recommended for comprehensive evaluation)</span
            >
          </h3>
          <p class="section-subtitle">
            Upload supporting documents for founder analysis, market validation,
            and traction assessment
          </p>

          <div class="upload-grid">
            <!-- Financial Projections & Business Model -->
            <div class="upload-item">
              <label class="upload-label">
                <i class="ri-line-chart-line"></i>
                Financial Projections
              </label>
              <FileUploadZone
                :file="uploadedFiles.financialModel"
                :is-uploading="uploadStates.financialModel"
                accept=".xlsx,.xls,.csv,.pdf"
                placeholder="Financial models & projections"
                @file-selected="
                  (file: File) => handleFileUpload('financialModel', file)
                "
                @change-file="() => changeFile('financialModel')"
                :max-size="10"
                file-type="Financial Projections"
                compact
              />
              <div
                v-if="validationErrors.financialModel"
                class="field-error compact"
              >
                <i class="ri-error-warning-line"></i>
                {{ validationErrors.financialModel }}
              </div>
            </div>

            <!-- Founder & Team Profiles -->
            <div class="upload-item">
              <label class="upload-label">
                <i class="ri-team-line"></i>
                Founder & Team Profiles
              </label>
              <FileUploadZone
                :file="uploadedFiles.founderProfiles"
                :is-uploading="uploadStates.founderProfiles"
                accept=".pdf,.doc,.docx"
                placeholder="Founder CVs & team backgrounds"
                @file-selected="
                  (file: File) => handleFileUpload('founderProfiles', file)
                "
                @change-file="() => changeFile('founderProfiles')"
                :max-size="8"
                file-type="Founder Profiles"
                compact
              />
              <div
                v-if="validationErrors.founderProfiles"
                class="field-error compact"
              >
                <i class="ri-error-warning-line"></i>
                {{ validationErrors.founderProfiles }}
              </div>
            </div>

            <!-- Market Research & Competitive Analysis -->
            <div class="upload-item">
              <label class="upload-label">
                <i class="ri-bar-chart-box-line"></i>
                Market Research & Competition
              </label>
              <FileUploadZone
                :file="uploadedFiles.marketResearch"
                :is-uploading="uploadStates.marketResearch"
                accept=".pdf,.doc,.docx,.xlsx"
                placeholder="Market analysis & competitive landscape"
                @file-selected="
                  (file: File) => handleFileUpload('marketResearch', file)
                "
                @change-file="() => changeFile('marketResearch')"
                :max-size="10"
                file-type="Market Research"
                compact
              />
              <div
                v-if="validationErrors.marketResearch"
                class="field-error compact"
              >
                <i class="ri-error-warning-line"></i>
                {{ validationErrors.marketResearch }}
              </div>
            </div>

            <!-- Traction & Metrics Data -->
            <div class="upload-item">
              <label class="upload-label">
                <i class="ri-trending-up-line"></i>
                Traction & Metrics Data
              </label>
              <FileUploadZone
                :file="uploadedFiles.tractionData"
                :is-uploading="uploadStates.tractionData"
                accept=".pdf,.xlsx,.csv,.png,.jpg"
                placeholder="Growth metrics, user data, revenue"
                @file-selected="
                  (file: File) => handleFileUpload('tractionData', file)
                "
                @change-file="() => changeFile('tractionData')"
                :max-size="5"
                file-type="Traction Data"
                compact
              />
              <div
                v-if="validationErrors.tractionData"
                class="field-error compact"
              >
                <i class="ri-error-warning-line"></i>
                {{ validationErrors.tractionData }}
              </div>
            </div>
          </div>
        </div>

        <!-- Manual Notes Input - Only show if no supporting docs uploaded -->
        <div v-if="!hasAnySupportingDocs" class="form-group transcript-input">
          <label for="transcript">
            <i class="ri-chat-3-line"></i>
            Additional Investment Notes
            <span class="optional">(Optional)</span>
          </label>
          <p class="input-description">
            Add any additional notes about the startup, founder conversations,
            or market insights
          </p>
          <div class="glassmorphism glow-effect">
            <textarea
              id="transcript"
              v-model="transcriptText"
              placeholder="Add notes about founder conversations, market insights, competitive advantages, or any other relevant investment considerations..."
              rows="5"
            ></textarea>
            <div class="char-counter">
              {{ transcriptText.length }}/5000 characters
            </div>
          </div>
        </div>

        <!-- Show message when supporting docs are uploaded -->
        <div v-if="hasAnySupportingDocs" class="transcript-file-notice">
          <div class="notice-content">
            <i class="ri-check-double-line"></i>
            <span
              >Excellent! We'll analyze your uploaded documents for
              comprehensive startup evaluation.</span
            >
          </div>
        </div>

        <!-- Document Summary -->
        <div v-if="hasAnyFiles" class="document-summary">
          <h4>
            <i class="ri-file-list-line"></i> Ready for Investment Analysis
          </h4>
          <div class="summary-grid">
            <template v-for="(file, key) in uploadedFiles" :key="key">
              <div v-if="file" class="summary-item">
                <i :class="getFileIcon(key as string)"></i>
                <div class="summary-info">
                  <span class="doc-type">{{
                    getDocumentType(key as string)
                  }}</span>
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                </div>
                <div class="doc-status verified">
                  <i class="ri-check-line"></i>
                  Ready
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Enhanced Analyze Button -->
        <button
          type="submit"
          class="analyze-btn glassmorphism"
          :class="{
            active: isFormReady && !isSubmitting,
            loading: isSubmitting,
          }"
          :disabled="!isFormReady || isSubmitting"
        >
          <div class="btn-content">
            <i
              :class="
                isSubmitting ? 'ri-loader-line spinning' : 'ri-brain-line'
              "
            ></i>
            <div class="btn-text">
              <span v-if="isSubmitting" class="main-text">
                Analyzing Documents...
              </span>
              <span v-else-if="!isFormReady" class="main-text">{{
                getButtonText()
              }}</span>
              <span v-else class="main-text">Generate Investment Analysis</span>

              <span v-if="isFormReady && !isSubmitting" class="sub-text"
                >AI-powered startup evaluation & due diligence</span
              >
              <span v-else-if="isSubmitting" class="sub-text">
                Please wait while we process your documents...
              </span>
            </div>
          </div>
        </button>
      </form>
    </div>
    <ErrorPopup
      :is-visible="showErrorPopup"
      :error-type="errorPopupConfig.type"
      :title="errorPopupConfig.title"
      :message="errorPopupConfig.message"
      :suggestions="errorPopupConfig.suggestions"
      @close="closeErrorPopup"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAnalysisStore } from "../stores/analysisStore";
import FileUploadZone from "../components/Molecules/FileUploadZone.vue";
import { getAllStartupSectors } from "../config/analysisConfig";
import ErrorPopup from "../components/Molecules/ErrorPopup.vue";
const isSubmitting = ref(false);
const showWeightageModal = ref(false);

const weights = ref({
  founder: 25,
  market: 25,
  differentiation: 25,
  team: 25,
});

const totalWeight = computed(() => {
  return (
    weights.value.founder +
    weights.value.market +
    weights.value.differentiation +
    weights.value.team
  );
});

// Reset to defaults
function resetWeights() {
  weights.value = {
    founder: 25,
    market: 25,
    differentiation: 25,
    team: 25,
  };
}

// ✅ ADD ERROR POPUP STATE
const showErrorPopup = ref(false);
const errorPopupConfig = ref<{
  type: "personal" | "non-business" | "insufficient" | "format" | "mixed";
  title: string;
  message: string;
  suggestions: string[];
}>({
  type: "personal",
  title: "Document Validation Failed",
  message: "This document cannot be analyzed.",
  suggestions: [],
});

const STARTUP_SECTORS_LIST = getAllStartupSectors();

// ✅ Type definitions to fix TypeScript errors
interface UploadedFiles {
  pitchDeck: File | null;
  financialModel: File | null;
  founderProfiles: File | null;
  marketResearch: File | null;
  tractionData: File | null;
}

interface UploadStates {
  pitchDeck: boolean;
  financialModel: boolean;
  founderProfiles: boolean;
  marketResearch: boolean;
  tractionData: boolean;
}

interface ValidationErrors {
  pitchDeck: string;
  financialModel: string;
  founderProfiles: string;
  marketResearch: string;
  tractionData: string;
}

type FileType = keyof UploadedFiles;
type BackendStatus =
  | "checking"
  | "connected"
  | "disconnected"
  | "healthy"
  | "unhealthy";

const router = useRouter();
const analysisStore = useAnalysisStore();

// Backend connection status
const backendStatus = ref<BackendStatus>("checking");

// Form state
const selectedCategory = ref<string>("");
const transcriptText = ref<string>("");

// ✅ TYPED FILE STRUCTURE
const uploadedFiles = ref<UploadedFiles>({
  pitchDeck: null,
  financialModel: null,
  founderProfiles: null,
  marketResearch: null,
  tractionData: null,
});

const uploadStates = ref<UploadStates>({
  pitchDeck: false,
  financialModel: false,
  founderProfiles: false,
  marketResearch: false,
  tractionData: false,
});

// ✅ TYPED VALIDATION ERRORS
const validationErrors = ref<ValidationErrors>({
  pitchDeck: "",
  financialModel: "",
  founderProfiles: "",
  marketResearch: "",
  tractionData: "",
});

// ✅ VALIDATION RULES FOR INVESTMENT DOCUMENTS
const fileValidation: Record<
  FileType,
  {
    types: string[];
    maxSize: number;
    extensions: string[];
  }
> = {
  pitchDeck: {
    types: [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    maxSize: 30 * 1024 * 1024,
    extensions: [".pdf", ".ppt", ".pptx"],
  },
  financialModel: {
    types: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "application/pdf",
    ],
    maxSize: 10 * 1024 * 1024,
    extensions: [".xlsx", ".xls", ".csv", ".pdf"],
  },
  founderProfiles: {
    types: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxSize: 8 * 1024 * 1024,
    extensions: [".pdf", ".doc", ".docx"],
  },
  marketResearch: {
    types: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    maxSize: 10 * 1024 * 1024,
    extensions: [".pdf", ".doc", ".docx", ".xlsx", ".xls"],
  },
  tractionData: {
    types: [
      "application/pdf",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "image/png",
      "image/jpeg",
    ],
    maxSize: 5 * 1024 * 1024,
    extensions: [".pdf", ".xlsx", ".csv", ".png", ".jpg", ".jpeg"],
  },
};

// Computed properties
const isFormReady = computed((): boolean => {
  return (
    uploadedFiles.value.pitchDeck !== null &&
    selectedCategory.value !== "" &&
    backendStatus.value === "connected" &&
    !Object.values(uploadStates.value).some((state: boolean) => state)
  );
});

const hasAnyFiles = computed((): boolean => {
  return Object.values(uploadedFiles.value).some(
    (file: File | null) => file !== null
  );
});

const hasAnySupportingDocs = computed((): boolean => {
  const { pitchDeck, ...supportingDocs } = uploadedFiles.value;
  return Object.values(supportingDocs).some(
    (file: File | null) => file !== null
  );
});

const uploadedFileCount = computed((): number => {
  return Object.values(uploadedFiles.value).filter(
    (file: File | null) => file !== null
  ).length;
});

// Backend status check on mount
onMounted(async (): Promise<void> => {
  if (analysisStore.error) {
    console.log("❌ Error from progress page detected:", analysisStore.error);

    showErrorPopup.value = true;
    errorPopupConfig.value = {
      type: "format",
      title: "❌ Analysis Failed",
      message: analysisStore.error,
      suggestions: [
        "Check your document format",
        "Try uploading a different file",
        "Ensure the document is a valid business document",
      ],
    };

    // Clear error so it doesn't show on next visit
    analysisStore.error = null;

    // Still check backend connection
    try {
      const isConnected: boolean = await analysisStore.checkBackendConnection();
      backendStatus.value = isConnected ? "connected" : "disconnected";
    } catch (error: any) {
      console.error("🔌 Backend connection check failed:", error);
      backendStatus.value = "disconnected";
    }
    // Don't continue - let user close popup and retry
    return;
  }

  // Check backend connection
  try {
    analysisStore.clearAnalysis();
    const isConnected: boolean = await analysisStore.checkBackendConnection();
    backendStatus.value = isConnected ? "connected" : "disconnected";

    if (!isConnected) {
      console.warn(
        "⚠️ Backend server not reachable. Please ensure backend is running"
      );
    } else {
      console.log("✅ Backend connection established");
    }
  } catch (error: any) {
    console.error("🔌 Backend connection check failed:", error);
    backendStatus.value = "disconnected";
  }
});

// Helper function for button text
function getButtonText(): string {
  if (backendStatus.value === "disconnected") {
    return "Start Backend Server First";
  }
  if (!uploadedFiles.value.pitchDeck) {
    return "Upload Pitch Deck to Begin";
  }
  if (!selectedCategory.value) {
    return "Select Startup Sector";
  }
  return "Upload Documents to Begin";
}

// ✅ SIMPLIFIED FRONTEND VALIDATION (just basic checks, backend does content validation)
function validateFile(file: File, documentType: FileType): boolean {
  const rules = fileValidation[documentType];

  // Clear previous error
  validationErrors.value[documentType] = "";

  // Check file size
  if (file.size > rules.maxSize) {
    const maxSizeMB: number = rules.maxSize / (1024 * 1024);
    validationErrors.value[documentType] =
      `File too large. Maximum size is ${maxSizeMB}MB`;
    return false;
  }

  // Check file extension
  const fileName: string = file.name.toLowerCase();
  const hasValidExtension: boolean = rules.extensions.some((ext: string) =>
    fileName.endsWith(ext)
  );

  if (!hasValidExtension) {
    validationErrors.value[documentType] =
      `Invalid file type. Supported: ${rules.extensions.join(", ")}`;
    return false;
  }

  // ✅ NOTE: Filename checking removed - backend validates actual content
  console.log(
    `✅ Frontend validation passed for ${fileName}. Backend will verify actual document content.`
  );

  return true;
}

// File upload handler
function handleFileUpload(documentType: FileType, file: File): void {
  if (!validateFile(file, documentType)) {
    return;
  }

  uploadStates.value[documentType] = true;
  uploadedFiles.value[documentType] = null;

  // Simulate upload delay
  setTimeout(() => {
    uploadedFiles.value[documentType] = file;
    uploadStates.value[documentType] = false;
    validationErrors.value[documentType] = ""; // Clear any validation errors
  }, 1500);
}

// Change file handler
function changeFile(documentType: FileType): void {
  uploadedFiles.value[documentType] = null;
  uploadStates.value[documentType] = false;
  validationErrors.value[documentType] = "";
}

// Analysis handler
async function handleAnalysis(): Promise<void> {
  if (!isFormReady.value || isSubmitting.value) return;

  isSubmitting.value = true;
  try {
    const analysisData = {
      category: selectedCategory.value,
      files: uploadedFiles.value,
      transcriptText: transcriptText.value,
      uploadedFileCount: uploadedFileCount.value,
      weights: weights.value,
    };

    console.log("🚀 Starting analysis with:", analysisData);

    // ✅ Set loading state FIRST
    analysisStore.isLoading = true;

    // ✅ START analysis but DON'T wait for it to complete
    analysisStore.runEnhancedAnalysis(analysisData).catch((error: any) => {
      console.error("❌ Analysis error caught:", error);

      // Extract error code
      const errorCode = error.code;
      const errorTypeMap: Record<
        string,
        "personal" | "non-business" | "insufficient" | "format" | "mixed"
      > = {
        PERSONAL_DOCUMENT: "personal",
        NOT_BUSINESS_CONTENT: "non-business",
        INSUFFICIENT_BUSINESS_CONTENT: "insufficient",
        INVALID_FILE_SIGNATURE: "format",
        NO_TEXT_EXTRACTED: "format",
        MIXED_PERSONAL_BUSINESS: "mixed",
        GEMINI_VALIDATION_FAILED: "non-business",
        LIKELY_STRUCTURED_DOCUMENT: "format",
      };

      const titleMap: Record<string, string> = {
        PERSONAL_DOCUMENT: "🔒 Personal Document Detected",
        NOT_BUSINESS_CONTENT: "📄 Not a Business Document",
        INSUFFICIENT_BUSINESS_CONTENT: "📊 Insufficient Business Content",
        INVALID_FILE_SIGNATURE: "❌ File Corrupted or Invalid",
        NO_TEXT_EXTRACTED: "❌ Cannot Read Document",
        MIXED_PERSONAL_BUSINESS: "⚠️ Mixed Content Detected",
        GEMINI_VALIDATION_FAILED: "🤖 AI Validation Failed",
        LIKELY_STRUCTURED_DOCUMENT: "📋 Form or ID Document",
      };

      const messageMap: Record<string, string> = {
        PERSONAL_DOCUMENT:
          "This document appears to contain personal information.\n\nWe cannot analyze personal or confidential documents to protect your privacy.",
        NOT_BUSINESS_CONTENT:
          "This document doesn't appear to be business-related.\n\nIt may contain news, recipes, entertainment, or other non-business content.",
        INSUFFICIENT_BUSINESS_CONTENT:
          "The document is too short or lacks business information.\n\nPlease ensure your document includes details about your business model, market opportunity, finances, and team.",
        INVALID_FILE_SIGNATURE:
          "File is corrupted or not a valid document.\n\nPlease reupload a valid PDF, DOCX, or PPTX file.",
        NO_TEXT_EXTRACTED:
          "Unable to extract text from the document.\n\nIt might be corrupted, password-protected, or an image without text.",
        MIXED_PERSONAL_BUSINESS:
          "Document contains both personal and business information.\n\nPlease upload pure business documents.",
        GEMINI_VALIDATION_FAILED:
          "AI validation failed. The document may not be a valid business document.\n\nPlease try a different file.",
        LIKELY_STRUCTURED_DOCUMENT:
          "This appears to be a form or ID document.\n\nPlease upload business documents like pitch decks or financial models.",
      };

      const suggestionsMap: Record<string, string[]> = {
        PERSONAL_DOCUMENT: [
          "Startup Pitch Deck",
          "Financial Projections/Model",
          "Business Plan",
          "Market Research",
          "Founder Profiles",
          "Traction Data",
        ],
        NOT_BUSINESS_CONTENT: [
          "Pitch decks",
          "Financial models",
          "Market analysis",
          "Business plans",
        ],
        INSUFFICIENT_BUSINESS_CONTENT: [
          "Add business model details",
          "Include market sizing (TAM/SAM/SOM)",
          "Add financial projections",
          "Include team information",
        ],
        INVALID_FILE_SIGNATURE: [
          "Re-export the document as PDF",
          "Check file format",
          "Verify file is not corrupted",
        ],
        NO_TEXT_EXTRACTED: [
          "Re-export document as PDF",
          "Remove password protection",
          "Use OCR on scanned images",
        ],
        MIXED_PERSONAL_BUSINESS: [
          "Remove personal information",
          "Use business documents only",
        ],
        GEMINI_VALIDATION_FAILED: [
          "Try a different document",
          "Ensure it's business-related",
        ],
        LIKELY_STRUCTURED_DOCUMENT: [
          "Upload pitch decks",
          "Upload financial models",
          "Upload market research",
        ],
      };

      // Show error popup
      if (errorCode && errorTypeMap[errorCode]) {
        showErrorPopup.value = true;
        errorPopupConfig.value = {
          type: errorTypeMap[errorCode],
          title: titleMap[errorCode],
          message: messageMap[errorCode],
          suggestions: suggestionsMap[errorCode],
        };
      } else {
        showErrorPopup.value = true;
        errorPopupConfig.value = {
          type: "format",
          title: "❌ Analysis Failed",
          message: error.message || "An error occurred. Please try again.",
          suggestions: ["Check the document", "Try a different file"],
        };
      }

      // Reset loading state
      analysisStore.isLoading = false;
      isSubmitting.value = false;
    });

    // ✅ IMMEDIATELY redirect to progress page (DON'T wait)
    console.log("📍 Redirecting to analysis-in-progress");
    router.push("/app/analysis-in-progress");
  } catch (error: any) {
    console.error("❌ Unexpected error:", error);
    isSubmitting.value = false;
  }
}

// ✅ ADD CLOSE POPUP HANDLER
function closeErrorPopup() {
  showErrorPopup.value = false;
}

// ✅ HELPER FUNCTIONS - PROPERLY TYPED
function getDocumentType(key: string): string {
  const types: Record<string, string> = {
    pitchDeck: "Pitch Deck",
    financialModel: "Financial Projections",
    founderProfiles: "Founder & Team Profiles",
    marketResearch: "Market Research & Analysis",
    tractionData: "Traction & Growth Metrics",
  };
  return types[key] || key;
}

function getFileIcon(key: string): string {
  const icons: Record<string, string> = {
    pitchDeck: "ri-presentation-fill",
    financialModel: "ri-line-chart-fill",
    founderProfiles: "ri-team-fill",
    marketResearch: "ri-bar-chart-box-fill",
    tractionData: "ri-rocket-fill",
  };
  return icons[key] || "ri-file-fill";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes: string[] = ["Bytes", "KB", "MB", "GB"];
  const i: number = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
</script>

<style lang="scss" scoped>
// Import variables
@import "@/styles/variables.scss";

// Font imports
@font-face {
  font-family: "AlibabaSans";
  src: url("https://assets-persist.lovart.ai/agent-static-assets/AlibabaSans-Regular.otf")
    format("opentype");
  font-weight: normal;
}

.page-wrapper {
  font-family: "AlibabaSans", sans-serif;
  background: linear-gradient(135deg, #1a1a1a 0%, #0c0c0c 100%);
  color: #ffffff;
  min-height: 100vh;
  padding: 40px 20px;
}

.container {
  max-width: 1000px;
  margin: 0 auto;

  h1 {
    font-size: 36px;
    font-weight: bold;
    color: #ffffff;
    margin-bottom: 12px;
    text-align: center;
  }

  .subtitle {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.7);
    text-align: center;
    margin-bottom: 40px;
  }
}

// Backend status
.backend-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  font-weight: 500;
  font-size: 14px;

  &.connected {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
  }

  &.disconnected {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }
}

// Form styling
.form-group {
  margin-bottom: 30px;

  label {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 12px;

    .mandatory {
      color: #ef4444;
    }

    .optional {
      color: rgba(255, 255, 255, 0.5);
      font-weight: 400;
      font-size: 14px;
    }
  }
}

.dropdown-wrapper {
  position: relative;

  .enhanced-select {
    width: 100%;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #ffffff;
    font-size: 16px;
    appearance: none;

    option {
      background: #1a1a1a;
      color: #ffffff;
    }
  }

  .dropdown-icon {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: $color-accent;
    pointer-events: none;
  }
}

// Upload sections
.upload-wrapper {
  margin-bottom: 20px;
}

.additional-documents {
  margin: 40px 0;

  .section-title {
    font-size: 20px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 10px;

    i {
      color: $color-accent;
    }

    .optional {
      font-size: 14px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.5);
    }
  }

  .section-subtitle {
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 24px;
  }
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.upload-item {
  .upload-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      color: $color-accent;
    }
  }
}

// Field errors
.field-error {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ef4444;
  font-size: 14px;
  margin-top: 8px;

  &.compact {
    font-size: 12px;
    margin-top: 4px;
  }

  i {
    font-size: 16px;
  }
}

// Transcript input
.transcript-input {
  textarea {
    width: 100%;
    min-height: 120px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #ffffff;
    font-size: 14px;
    resize: vertical;
    font-family: "AlibabaSans", sans-serif;

    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
  }

  .char-counter {
    text-align: right;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 8px;
  }
}

// Analyze button
.analyze-btn {
  width: 100%;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 40px;

  &.active {
    background: linear-gradient(135deg, $color-accent, $color-accent-darker);
    border-color: $color-accent;
    box-shadow: 0 0 30px rgba($color-accent, 0.3);

    &:hover {
      box-shadow: 0 0 40px rgba($color-accent, 0.5);
      transform: translateY(-2px);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }

  &.loading {
    cursor: not-allowed;
    opacity: 0.8;

    .spinning {
      animation: spin 1s linear infinite;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  .btn-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;

    i {
      font-size: 24px;
    }

    .btn-text {
      display: flex;
      flex-direction: column;
      align-items: center;

      .main-text {
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
      }

      .sub-text {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
        margin-top: 4px;
      }
    }
  }
}

// Document summary
.document-summary {
  margin: 30px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  h4 {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #ffffff;
    margin-bottom: 16px;

    i {
      color: $color-accent;
    }
  }
}

.summary-grid {
  display: grid;
  gap: 12px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;

  i {
    color: $color-accent;
    font-size: 20px;
  }

  .summary-info {
    flex: 1;

    .doc-type {
      font-weight: 500;
      color: #ffffff;
      font-size: 14px;
    }

    .file-name {
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
    }

    .file-size {
      color: rgba(255, 255, 255, 0.5);
      font-size: 11px;
    }
  }

  .doc-status {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;

    &.verified {
      color: #22c55e;
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// Responsive
@media (max-width: 768px) {
  .upload-grid {
    grid-template-columns: 1fr;
  }
}

.customize-weights-btn {
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.15),
    rgba(168, 85, 247, 0.1)
  );
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: #00d4ff;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;

  i {
    font-size: 18px;
  }

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(0, 212, 255, 0.25),
      rgba(168, 85, 247, 0.15)
    );
    border-color: rgba(0, 212, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 212, 255, 0.2);
  }
}

.weightage-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.weightage-modal-content {
  background: #1a2332;
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 24px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.weightage-customization {
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-top: 30px;

  h4 {
    margin: 0 0 20px 0;
  }
}

.weight-slider-group {
  margin-bottom: 20px;
}

.weight-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.weight-value {
  color: #00d4ff;
  font-weight: 600;
}

.weight-slider {
  width: 100%;
  height: 6px;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  border-radius: 3px;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #00d4ff;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #00d4ff;
    border: none;
    border-radius: 50%;
    cursor: pointer;
  }
}

.weight-total {
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  text-align: center;
  margin: 16px 0;
  font-weight: 600;

  &.valid {
    border: 1px solid #22c55e;
    color: #22c55e;
  }

  &.invalid {
    border: 1px solid #ef4444;
    color: #ef4444;
  }
}

.customized-score-display {
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.1),
    rgba(34, 197, 94, 0.1)
  );
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
  text-align: center;

  h3 {
    margin: 0;
  }
}

.reset-btn {
  width: 100%;
  padding: 10px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: #00d4ff;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.2);
  }
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.5em;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: #ffffff;
  }
}

.weightage-note {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 8px;
  text-align: center;
}
</style>
