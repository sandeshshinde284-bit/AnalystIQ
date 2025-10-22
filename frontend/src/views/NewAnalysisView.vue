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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAnalysisStore } from "../stores/analysisStore";
import FileUploadZone from "../components/Molecules/FileUploadZone.vue";
import { getAllStartupSectors } from "../config/analysisConfig";
const isSubmitting = ref(false);

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

// Enhanced file validation with individual error tracking
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

  // Check file type
  const fileName: string = file.name.toLowerCase();
  const hasValidExtension: boolean = rules.extensions.some((ext: string) =>
    fileName.endsWith(ext)
  );

  if (!hasValidExtension) {
    validationErrors.value[documentType] =
      `Invalid file type. Supported: ${rules.extensions.join(", ")}`;
    return false;
  }

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
    };

    console.log("🚀 Starting analysis with:", analysisData);
    await analysisStore.runEnhancedAnalysis(analysisData);
    router.push("/app/analysis-in-progress");
  } catch (error: any) {
    console.error("❌ Analysis failed:", error);
    alert(`Analysis failed: ${error.message}`);
  }
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
</style>
