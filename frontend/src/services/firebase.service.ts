import { googleCloudConfig } from "@/config/googleCloud";

// ✅ FIXED: Updated to match orchestrator interface
export interface AnalysisProgress {
  status: "processing" | "completed" | "failed";
  step: string;
  progress: number;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface SavedAnalysis {
  id: string;
  userId: string;
  startupName: string;
  createdAt: string;
  status: "processing" | "completed" | "failed";
  recommendation?: {
    text: string;
    score: number;
  };
  keyMetrics?: any[];
  documents?: any[];
  analysisMetadata?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  lastLoginAt: string;
  preferences?: {
    emailNotifications: boolean;
    analysisAlerts: boolean;
    reportFormat: "detailed" | "summary";
  };
}

export interface FileUploadResult {
  downloadURL: string;
  fileName: string;
  filePath: string;
  uploadedAt: string;
}

class FirebaseService {
  private readonly isEnabled: boolean;
  private analysisCache: Map<string, SavedAnalysis> = new Map();
  private progressCache: Map<string, AnalysisProgress> = new Map();

  constructor() {
    this.isEnabled = !!googleCloudConfig.projectId;

    if (!this.isEnabled) {
      console.warn("⚠️ Firebase not configured - using local fallback mode");
    } else {
      console.log("✅ Firebase service initialized (fallback mode)");
    }
  }

  // ============================================================================
  // ANALYSIS PROGRESS TRACKING
  // ============================================================================

  async saveAnalysisProgress(
    analysisId: string,
    progress: AnalysisProgress
  ): Promise<void> {
    try {
      // ✅ FIXED: Handle both old and new interface properties
      const progressData: AnalysisProgress = {
        status: progress.status,
        step: progress.step,
        progress: progress.progress,
        message: progress.message,
        error: progress.error,
        timestamp: progress.timestamp || new Date().toISOString(),
      };

      this.progressCache.set(analysisId, progressData);

      console.log(
        `✅ Progress saved for analysis: ${analysisId} - ${progress.step} (${progress.progress}%)`
      );
    } catch (error) {
      console.error(`Failed to save progress for ${analysisId}:`, error);
    }
  }

  async getAnalysisProgress(
    analysisId: string
  ): Promise<AnalysisProgress | null> {
    try {
      return this.progressCache.get(analysisId) || null;
    } catch (error) {
      console.error(`Failed to get progress for ${analysisId}:`, error);
      return null;
    }
  }

  // ============================================================================
  // ANALYSIS HISTORY
  // ============================================================================

  async getAnalysisHistory(userId: string): Promise<SavedAnalysis[]> {
    try {
      console.log(`Getting analysis history for user: ${userId}`);

      // Return analyses from cache for this user
      const userAnalyses = Array.from(this.analysisCache.values())
        .filter((analysis) => analysis.userId === userId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 20);

      return userAnalyses;
    } catch (error) {
      console.error(
        `Failed to get analysis history for user ${userId}:`,
        error
      );
      return [];
    }
  }

  async saveAnalysisResult(
    analysisId: string,
    analysisData: any
  ): Promise<void> {
    try {
      const savedAnalysis: SavedAnalysis = {
        id: analysisId,
        userId: analysisData.userId,
        startupName: analysisData.startupName || "Unknown Startup",
        createdAt: analysisData.createdAt || new Date().toISOString(),
        status: analysisData.status || "completed",
        recommendation: analysisData.recommendation,
        keyMetrics: analysisData.keyMetrics,
        documents: analysisData.documents,
        analysisMetadata: analysisData.analysisMetadata,
        ...analysisData, // Include all other properties
        savedAt: new Date().toISOString(),
      };

      this.analysisCache.set(analysisId, savedAnalysis);
      console.log(`✅ Analysis result saved: ${analysisId}`);
    } catch (error) {
      console.error(`Failed to save analysis result ${analysisId}:`, error);
      throw new Error(
        `Failed to save analysis: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getAnalysisById(analysisId: string): Promise<SavedAnalysis | null> {
    try {
      return this.analysisCache.get(analysisId) || null;
    } catch (error) {
      console.error(`Failed to get analysis ${analysisId}:`, error);
      return null;
    }
  }

  async deleteAnalysis(analysisId: string): Promise<boolean> {
    try {
      const deleted = this.analysisCache.delete(analysisId);
      if (deleted) {
        console.log(`✅ Analysis deleted: ${analysisId}`);
      }
      return deleted;
    } catch (error) {
      console.error(`Failed to delete analysis ${analysisId}:`, error);
      return false;
    }
  }

  // ============================================================================
  // AUTHENTICATION (Simplified)
  // ============================================================================

  async signInUser(email: string, password: string): Promise<any> {
    console.log("Sign in simulation for:", email);
    // Simulate user object
    return {
      user: {
        uid: "simulated-user-id",
        email,
        displayName: email.split("@")[0],
      },
    };
  }

  async signUpUser(
    email: string,
    password: string,
    displayName?: string
  ): Promise<any> {
    console.log("Sign up simulation for:", email);

    // Create user profile
    await this.createUserProfile("simulated-user-id", {
      email,
      displayName: displayName || email.split("@")[0],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      preferences: {
        emailNotifications: true,
        analysisAlerts: true,
        reportFormat: "detailed",
      },
    });

    return {
      user: {
        uid: "simulated-user-id",
        email,
        displayName: displayName || email.split("@")[0],
      },
    };
  }

  async signOutUser(): Promise<void> {
    console.log("✅ User signed out (simulation)");
  }

  onAuthStateChange(callback: (user: any) => void): () => void {
    // Simulate logged in user
    setTimeout(() => {
      callback({
        uid: "simulated-user-id",
        email: "user@example.com",
        displayName: "Demo User",
      });
    }, 100);

    return function unsubscribe() {
      console.log("Auth state change unsubscribed");
    };
  }

  getCurrentUser(): any {
    return {
      uid: "simulated-user-id",
      email: "user@example.com",
      displayName: "Demo User",
    };
  }

  // ============================================================================
  // USER PROFILES
  // ============================================================================

  private userProfileCache: Map<string, UserProfile> = new Map();

  async createUserProfile(
    userId: string,
    profileData: Partial<UserProfile>
  ): Promise<void> {
    try {
      const profile: UserProfile = {
        uid: userId,
        email: profileData.email || "",
        displayName: profileData.displayName || "",
        createdAt: profileData.createdAt || new Date().toISOString(),
        lastLoginAt: profileData.lastLoginAt || new Date().toISOString(),
        preferences: profileData.preferences || {
          emailNotifications: true,
          analysisAlerts: true,
          reportFormat: "detailed",
        },
      };

      this.userProfileCache.set(userId, profile);
      console.log(`✅ User profile created: ${userId}`);
    } catch (error) {
      console.error(`Failed to create user profile for ${userId}:`, error);
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.userProfileCache.get(userId) || null;
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<void> {
    try {
      const existing = this.userProfileCache.get(userId);
      if (existing) {
        const updated = { ...existing, ...updates };
        this.userProfileCache.set(userId, updated);
        console.log(`✅ User profile updated: ${userId}`);
      }
    } catch (error) {
      console.error(`Failed to update user profile for ${userId}:`, error);
    }
  }

  // ============================================================================
  // FILE STORAGE (Simplified)
  // ============================================================================

  async uploadFile(
    file: File,
    folder = "documents",
    progressCallback?: (progress: number) => void
  ): Promise<FileUploadResult> {
    try {
      // Simulate upload progress
      if (progressCallback) {
        for (let i = 0; i <= 100; i += 10) {
          setTimeout(() => progressCallback(i), i * 10);
        }
      }

      // Simulate file upload
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result: FileUploadResult = {
        downloadURL: `https://example.com/files/${file.name}`,
        fileName: file.name,
        filePath: `${folder}/${file.name}`,
        uploadedAt: new Date().toISOString(),
      };

      console.log(`✅ File upload simulated: ${file.name}`);
      return result;
    } catch (error) {
      console.error("File upload simulation failed:", error);
      throw new Error(
        `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    console.log(`✅ File deletion simulated: ${filePath}`);
    return true;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  isAuthenticated(): boolean {
    return true; // Always authenticated in simulation mode
  }

  getCurrentUserId(): string | null {
    return "simulated-user-id";
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  getFirebaseConfig() {
    return {
      isEnabled: this.isEnabled,
      hasAuth: true,
      hasFirestore: true,
      hasStorage: true,
      mode: "simulation",
    };
  }

  // ============================================================================
  // PROGRESS UTILITIES
  // ============================================================================

  // Get all progress updates for an analysis
  getAllProgressUpdates(analysisId: string): AnalysisProgress[] {
    // In a real implementation, this would fetch all progress updates
    // For now, return the latest one
    const latest = this.progressCache.get(analysisId);
    return latest ? [latest] : [];
  }

  // Clear progress cache for completed analyses
  clearCompletedProgress(): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    this.progressCache.forEach((progress, analysisId) => {
      if (progress.timestamp) {
        const progressTime = new Date(progress.timestamp).getTime();
        if (
          progressTime < oneHourAgo &&
          (progress.status === "completed" || progress.status === "failed")
        ) {
          this.progressCache.delete(analysisId);
        }
      }
    });
  }
}

export default new FirebaseService();
export { FirebaseService };
