//FIREBASE.SERVICE.TS

import admin from "firebase-admin";
import { getFirestore, Firestore, FieldValue } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";
import { getAuth, Auth } from "firebase-admin/auth";
import { googleCloudConfig } from "../config/googleCloud.js";
import logger from "../utils/logger.js";
import { AnalysisProgress } from "../services/analysisOrchestrator.service.js";

// ============================================================================
// INTERFACES
// ============================================================================

//export interface AnalysisProgress {
//    status: "processing" | "completed" | "failed";
//    step: string;
//    progress: number;
//    error?: string;
//    message?: string;
//    timestamp: string;
//}

export interface SavedAnalysis {
  id: string;
  userId: string;
  startupName: string;
  createdAt: string;
  updatedAt: string;
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
  preferences: {
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
  fileSize: number;
  contentType: string;
}

export interface FirebaseConfig {
  isEnabled: boolean;
  hasAuth: boolean;
  hasFirestore: boolean;
  hasStorage: boolean;
  mode: "production" | "development" | "simulation";
}

// ============================================================================
// FIREBASE SERVICE CLASS
// ============================================================================

class FirebaseService {
  private readonly isEnabled: boolean;
  private firestore: Firestore | null = null;
  private storage: Storage | null = null;
  private auth: Auth | null = null;
  private readonly collections = {
    analyses: "analyses",
    analysisProgress: "analysisProgress",
    userProfiles: "userProfiles",
    users: "users",
  };

  constructor() {
    this.isEnabled = this.initializeFirebase();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeFirebase(): boolean {
    try {
      if (!googleCloudConfig.projectId) {
        logger.warn("⚠️ Firebase not configured - missing project ID");
        return false;
      }
      if (
        !process.env.FIREBASE_CLIENT_EMAIL ||
        !process.env.FIREBASE_PRIVATE_KEY
      ) {
        logger.warn(
          "⚠️ Firebase credentials not found in environment variables"
        );
        return false;
      }

      // Initialize Firebase Admin SDK if not already initialized
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: googleCloudConfig.projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          }),
          projectId: googleCloudConfig.projectId,
          storageBucket: `${googleCloudConfig.projectId}.appspot.com`,
        });
      }

      // Initialize services
      this.firestore = getFirestore();
      this.storage = getStorage();
      this.auth = getAuth();
      logger.info("✅ Firebase Admin SDK initialized successfully");
      return true;
    } catch (error) {
      logger.error("❌ Failed to initialize Firebase Admin SDK:", error);
      return false;
    }
  }

  // ============================================================================
  // ANALYSIS PROGRESS TRACKING
  // ============================================================================

  async saveAnalysisProgress(
    analysisId: string,
    progress: AnalysisProgress
  ): Promise<void> {
    if (!this.isEnabled || !this.firestore) {
      logger.warn("Firebase not available - progress not saved");
      return;
    }
    try {
      const progressData: AnalysisProgress = {
        ...progress,
        timestamp: new Date().toISOString(),
      };
      await this.firestore
        .collection(this.collections.analysisProgress)
        .doc(analysisId)
        .set(progressData, { merge: true });
      logger.info(
        `✅ Progress saved for analysis: ${analysisId} - ${progress.step} (${progress.progress}%)`
      );
    } catch (error) {
      logger.error(`❌ Failed to save progress for ${analysisId}:`, error);
      throw new Error("Failed to save analysis progress");
    }
  }

  async getAnalysisProgress(
    analysisId: string
  ): Promise<AnalysisProgress | null> {
    if (!this.isEnabled || !this.firestore) {
      return null;
    }

    try {
      const doc = await this.firestore
        .collection(this.collections.analysisProgress)
        .doc(analysisId)
        .get();
      return doc.exists ? (doc.data() as AnalysisProgress) : null;
    } catch (error) {
      logger.error(`❌ Failed to get progress for ${analysisId}:`, error);
      return null;
    }
  }

  async deleteAnalysisProgress(analysisId: string): Promise<boolean> {
    if (!this.isEnabled || !this.firestore) {
      return false;
    }

    try {
      await this.firestore
        .collection(this.collections.analysisProgress)
        .doc(analysisId)
        .delete();
      logger.info(`✅ Progress deleted for analysis: ${analysisId}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to delete progress for ${analysisId}:`, error);
      return false;
    }
  }

  // ============================================================================
  // ANALYSIS HISTORY & MANAGEMENT
  // ============================================================================

  async getAnalysisHistory(
    userId: string,
    limit: number = 20
  ): Promise<SavedAnalysis[]> {
    if (!this.isEnabled || !this.firestore) return [];
    try {
      const snapshot = await this.firestore
        .collection(this.collections.analyses)
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
      const analyses = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as SavedAnalysis)
      );
      logger.info(
        `✅ Retrieved ${analyses.length} analyses for user: ${userId}`
      );
      return analyses;
    } catch (error) {
      logger.error(
        `❌ Failed to get analysis history for user ${userId}:`,
        error
      );
      return [];
    }
  }

  async saveAnalysisResult(
    analysisId: string,
    analysisData: Partial<SavedAnalysis>
  ): Promise<void> {
    if (!this.isEnabled || !this.firestore) {
      throw new Error("Firebase not available");
    }
    try {
      if (!analysisData.userId) {
        throw new Error("User ID is required for saving analysis");
      }

      // ✅ FIX #1: SPREAD FIRST, THEN OVERRIDE
      const savedAnalysis: SavedAnalysis = {
        ...analysisData,
        id: analysisId,
        userId: analysisData.userId,
        startupName: analysisData.startupName || "Unknown Startup",
        createdAt: analysisData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: analysisData.status || "completed",
        keyMetrics: analysisData.keyMetrics || [],
        documents: analysisData.documents || [],
        analysisMetadata: analysisData.analysisMetadata || {},
      };

      await this.firestore
        .collection(this.collections.analyses)
        .doc(analysisId)
        .set(savedAnalysis);
      logger.info(`✅ Analysis result saved: ${analysisId}`);
    } catch (error) {
      logger.error(`❌ Failed to save analysis result ${analysisId}:`, error);
      throw new Error(
        `Failed to save analysis: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getAnalysisById(analysisId: string): Promise<SavedAnalysis | null> {
    if (!this.isEnabled || !this.firestore) return null;
    try {
      const doc = await this.firestore
        .collection(this.collections.analyses)
        .doc(analysisId)
        .get();
      return doc.exists
        ? ({ id: doc.id, ...doc.data() } as SavedAnalysis)
        : null;
    } catch (error) {
      logger.error(`❌ Failed to get analysis ${analysisId}:`, error);
      return null;
    }
  }

  async deleteAnalysis(analysisId: string): Promise<boolean> {
    if (!this.isEnabled || !this.firestore) return false;
    try {
      const batch = this.firestore.batch();
      const analysisRef = this.firestore
        .collection(this.collections.analyses)
        .doc(analysisId);
      batch.delete(analysisRef);
      const progressRef = this.firestore
        .collection(this.collections.analysisProgress)
        .doc(analysisId);
      batch.delete(progressRef);
      await batch.commit();
      logger.info(`✅ Analysis and progress deleted: ${analysisId}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to delete analysis ${analysisId}:`, error);
      return false;
    }
  }

  async updateAnalysisStatus(
    analysisId: string,
    status: SavedAnalysis["status"],
    error?: string
  ): Promise<void> {
    if (!this.isEnabled || !this.firestore) return;
    try {
      const updateData: any = {
        status,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (error) {
        updateData.error = error;
      }
      await this.firestore
        .collection(this.collections.analyses)
        .doc(analysisId)
        .update(updateData);
      logger.info(`✅ Analysis status updated: ${analysisId} -> ${status}`);
    } catch (error) {
      logger.error(
        `❌ Failed to update analysis status for ${analysisId}:`,
        error
      );
    }
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async verifyIdToken(
    token: string
  ): Promise<admin.auth.DecodedIdToken | null> {
    if (!this.isEnabled || !this.auth) return null;
    try {
      const decodedToken = await this.auth.verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      logger.error("❌ Token verification failed:", error);
      return null;
    }
  }

  async createCustomToken(
    uid: string,
    additionalClaims?: object
  ): Promise<string> {
    if (!this.isEnabled || !this.auth) {
      throw new Error("Firebase Auth not available");
    }
    try {
      return await this.auth.createCustomToken(uid, additionalClaims);
    } catch (error) {
      logger.error("❌ Custom token creation failed:", error);
      throw new Error("Failed to create custom token");
    }
  }

  async getUserByEmail(email: string): Promise<admin.auth.UserRecord | null> {
    if (!this.isEnabled || !this.auth) return null;
    try {
      return await this.auth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        return null;
      }
      logger.error(`❌ Failed to get user by email ${email}:`, error);
      return null;
    }
  }

  async createUser(userData: {
    email: string;
    password?: string;
    displayName?: string;
    photoURL?: string;
  }): Promise<admin.auth.UserRecord> {
    if (!this.isEnabled || !this.auth) {
      throw new Error("Firebase Auth not available");
    }
    try {
      // ✅ FIX #2: CONVERT UNDEFINED TO NULL
      const userRecord = await this.auth.createUser({
        email: userData.email,
        displayName: userData.displayName ?? null, // ✅ FIX: Convert undefined to null
        photoURL: userData.photoURL ?? null, // ✅ FIX: Convert undefined to null
        ...(userData.password && { password: userData.password }),
      });

      logger.info(`✅ User created: ${userRecord.uid} (${userData.email})`);
      return userRecord;
    } catch (error) {
      logger.error("❌ User creation failed:", error);
      throw new Error(
        `Failed to create user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // ============================================================================
  // HEALTH CHECK & UTILITIES
  // ============================================================================

  async healthCheck(): Promise<boolean> {
    try {
      return this.isEnabled;
    } catch (error) {
      console.error("Gemini health check failed:", error);
      return false;
    }
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default new FirebaseService();
export { FirebaseService };
