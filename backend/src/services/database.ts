//DATABASE.TS

import { db, isFirebaseAvailable } from "../config/googleCloud.js";
import * as admin from "firebase-admin";

// Database interfaces
export interface DatabaseDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisDocument extends DatabaseDocument {
  userId: string;
  startupName: string;
  status: "processing" | "completed" | "failed";
  progress: number;
  result?: any;
  documents?: any[];
}

export interface UserDocument extends DatabaseDocument {
  email: string;
  name: string;
  role: "admin" | "analyst" | "viewer";
  lastLoginAt?: string;
}

// Database collections
export const COLLECTIONS = {
  ANALYSES: "analyses",
  USERS: "users",
  ANALYSIS_PROGRESS: "analysis_progress",
  MARKET_DATA: "market_data",
  COMPETITIVE_INTELLIGENCE: "competitive_intelligence",
} as const;

type WhereFilterOp = admin.firestore.WhereFilterOp;
type OrderByDirection = admin.firestore.OrderByDirection;

interface WhereCondition {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

interface OrderByCondition {
  field: string;
  direction: OrderByDirection;
}

interface QueryConditions {
  where?: WhereCondition[];
  orderBy?: OrderByCondition[];
  limit?: number;
}

class DatabaseService {
  private readonly isEnabled: boolean;
  private localCache: Map<string, Map<string, any>> = new Map();

  constructor() {
    this.isEnabled = isFirebaseAvailable();

    if (!this.isEnabled) {
      console.warn("⚠️ Database not available - using local cache mode");
      this.initializeLocalCollections();
    } else {
      console.log("✅ Database service initialized with Firestore");
    }
  }

  private initializeLocalCollections(): void {
    Object.values(COLLECTIONS).forEach((collection) => {
      this.localCache.set(collection, new Map());
    });
  }

  private getCollection(collectionName: string): Map<string, any> {
    if (!this.localCache.has(collectionName)) {
      this.localCache.set(collectionName, new Map());
    }
    return this.localCache.get(collectionName)!;
  }

  // Generic CRUD operations with fallback
  async create<T extends DatabaseDocument>(
    collectionName: string,
    id: string,
    data: Omit<T, "id" | "createdAt" | "updatedAt">
  ): Promise<T> {
    try {
      const timestamp = new Date().toISOString();
      const docData = {
        ...data,
        id,
        createdAt: timestamp,
        updatedAt: timestamp,
      } as T;

      if (this.isEnabled && db) {
        // Use Firebase Admin
        await db.collection(collectionName).doc(id).set(docData);
      } else {
        // Use local cache
        const collection = this.getCollection(collectionName);
        collection.set(id, docData);
      }

      console.log(`✅ Document created in ${collectionName}:`, id);
      return docData;
    } catch (error) {
      console.error(`Failed to create document in ${collectionName}:`, error);
      throw new Error(`Database create operation failed: ${error}`);
    }
  }

  async read<T extends DatabaseDocument>(
    collectionName: string,
    id: string
  ): Promise<T | null> {
    try {
      if (this.isEnabled && db) {
        // Use Firebase Admin
        const docRef = db.collection(collectionName).doc(id);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          return docSnap.data() as T;
        }
        return null;
      } else {
        // Use local cache
        const collection = this.getCollection(collectionName);
        return collection.get(id) || null;
      }
    } catch (error) {
      console.error(`Failed to read document from ${collectionName}:`, error);
      throw new Error(`Database read operation failed: ${error}`);
    }
  }

  async update<T extends DatabaseDocument>(
    collectionName: string,
    id: string,
    data: Partial<Omit<T, "id" | "createdAt">>
  ): Promise<void> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      if (this.isEnabled && db) {
        // Use Firebase Admin
        await db.collection(collectionName).doc(id).update(updateData);
      } else {
        // Use local cache
        const collection = this.getCollection(collectionName);
        const existing = collection.get(id);
        if (existing) {
          collection.set(id, { ...existing, ...updateData });
        }
      }

      console.log(`✅ Document updated in ${collectionName}:`, id);
    } catch (error) {
      console.error(`Failed to update document in ${collectionName}:`, error);
      throw new Error(`Database update operation failed: ${error}`);
    }
  }

  async delete(collectionName: string, id: string): Promise<void> {
    try {
      if (this.isEnabled && db) {
        // Use Firebase Admin
        await db.collection(collectionName).doc(id).delete();
      } else {
        // Use local cache
        const collection = this.getCollection(collectionName);
        collection.delete(id);
      }

      console.log(`✅ Document deleted from ${collectionName}:`, id);
    } catch (error) {
      console.error(`Failed to delete document from ${collectionName}:`, error);
      throw new Error(`Database delete operation failed: ${error}`);
    }
  }

  async list<T extends DatabaseDocument>(
    collectionName: string,
    conditions?: QueryConditions
  ): Promise<T[]> {
    try {
      if (this.isEnabled && db) {
        // Use Firebase Admin
        let query: admin.firestore.Query = db.collection(collectionName);

        if (conditions?.where) {
          conditions.where.forEach(({ field, operator, value }) => {
            query = query.where(field, operator, value);
          });
        }

        if (conditions?.orderBy) {
          conditions.orderBy.forEach(({ field, direction }) => {
            query = query.orderBy(field, direction);
          });
        }

        if (conditions?.limit) {
          query = query.limit(conditions.limit);
        }

        const querySnapshot = await query.get();
        return querySnapshot.docs.map((doc) => doc.data() as T);
      } else {
        // Use local cache
        const collection = this.getCollection(collectionName);
        let results = Array.from(collection.values()) as T[];

        // Apply basic filtering (simplified)
        if (conditions?.where) {
          conditions.where.forEach(({ field, operator, value }) => {
            results = results.filter((doc) => {
              const fieldValue = (doc as any)[field];
              switch (operator) {
                case "==":
                  return fieldValue === value;
                case "!=":
                  return fieldValue !== value;
                case ">":
                  return fieldValue > value;
                case "<":
                  return fieldValue < value;
                case ">=":
                  return fieldValue >= value;
                case "<=":
                  return fieldValue <= value;
                default:
                  return true;
              }
            });
          });
        }

        // Apply sorting
        if (conditions?.orderBy) {
          conditions.orderBy.forEach(({ field, direction }) => {
            results.sort((a, b) => {
              const aVal = (a as any)[field];
              const bVal = (b as any)[field];
              if (direction === "asc") {
                return aVal > bVal ? 1 : -1;
              } else {
                return aVal < bVal ? 1 : -1;
              }
            });
          });
        }

        // Apply limit
        if (conditions?.limit) {
          results = results.slice(0, conditions.limit);
        }

        return results;
      }
    } catch (error) {
      console.error(`Failed to list documents from ${collectionName}:`, error);
      throw new Error(`Database list operation failed: ${error}`);
    }
  }

  // Analysis-specific operations
  async createAnalysis(
    analysisData: Omit<AnalysisDocument, "id" | "createdAt" | "updatedAt">
  ): Promise<AnalysisDocument> {
    const id = `analysis_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    return this.create<AnalysisDocument>(
      COLLECTIONS.ANALYSES,
      id,
      analysisData
    );
  }

  async getAnalysis(id: string): Promise<AnalysisDocument | null> {
    return this.read<AnalysisDocument>(COLLECTIONS.ANALYSES, id);
  }

  async updateAnalysisProgress(
    id: string,
    progress: number,
    status: AnalysisDocument["status"]
  ): Promise<void> {
    await this.update<AnalysisDocument>(COLLECTIONS.ANALYSES, id, {
      progress,
      status,
    });
  }

  async getUserAnalyses(
    userId: string,
    limitCount = 20
  ): Promise<AnalysisDocument[]> {
    return this.list<AnalysisDocument>(COLLECTIONS.ANALYSES, {
      where: [{ field: "userId", operator: "==", value: userId }],
      orderBy: [{ field: "createdAt", direction: "desc" }],
      limit: limitCount,
    });
  }

  // User-specific operations
  async createUser(
    userData: Omit<UserDocument, "id" | "createdAt" | "updatedAt">
  ): Promise<UserDocument> {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return this.create<UserDocument>(COLLECTIONS.USERS, id, userData);
  }

  async getUserByEmail(email: string): Promise<UserDocument | null> {
    const users = await this.list<UserDocument>(COLLECTIONS.USERS, {
      where: [{ field: "email", operator: "==", value: email }],
      limit: 1,
    });
    return users[0] || null;
  }

  // Utility methods
  isAvailable(): boolean {
    return this.isEnabled;
  }

  getMode(): "firebase" | "local" {
    return this.isEnabled ? "firebase" : "local";
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      if (this.isEnabled) {
        // Try to read a test document
        await this.read("health_check", "test");
      } else {
        // Test local cache
        const testId = "health_test";
        await this.create("health_check", testId, { test: true });
        const result = await this.read("health_check", testId);
        await this.delete("health_check", testId);
        return !!result;
      }
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }

  // Clear local cache (useful for testing)
  clearLocalCache(): void {
    this.localCache.clear();
    this.initializeLocalCollections();
    console.log("✅ Local cache cleared");
  }
}

export const databaseService = new DatabaseService();
export default databaseService;
