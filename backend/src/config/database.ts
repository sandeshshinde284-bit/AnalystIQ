// backend -> src -> config -> database.ts
import { getFirestore, isFirebaseAvailable } from "../config/googleCloud.js";

class DatabaseService {
  private firestore: any = null;
  private mode: "cloud" | "local" = "local";
  private localCache: Map<string, any> = new Map();

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    if (isFirebaseAvailable()) {
      this.firestore = getFirestore();
      this.mode = "cloud";
      console.log("✅ Database connected to Firebase Cloud");
    } else {
      this.mode = "local";
      console.log("⚠️ Database running in local mode");
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (this.mode === "cloud" && this.firestore) {
        // Test Firebase connection
        const testDoc = this.firestore.collection("health_check").doc("test");
        await testDoc.set({ timestamp: new Date().toISOString() });
        await testDoc.delete();
        console.log("✅ Firebase health check passed");
        return true;
      } else {
        // Test local cache
        const testId = "health_test";
        this.localCache.set(testId, { timestamp: new Date() });
        const exists = this.localCache.has(testId);
        this.localCache.delete(testId);
        console.log(
          `✅ Local database health check: ${exists ? "passed" : "failed"}`
        );
        return exists;
      }
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }

  getMode(): string {
    return this.mode;
  }

  isCloudMode(): boolean {
    return this.mode === "cloud";
  }

  // Add other database methods as needed
  async create(collection: string, data: any): Promise<string> {
    if (this.mode === "cloud" && this.firestore) {
      const docRef = await this.firestore.collection(collection).add(data);
      return docRef.id;
    } else {
      const id = Date.now().toString();
      this.localCache.set(`${collection}_${id}`, data);
      return id;
    }
  }

  async get(collection: string, id: string): Promise<any> {
    if (this.mode === "cloud" && this.firestore) {
      const doc = await this.firestore.collection(collection).doc(id).get();
      return doc.exists ? doc.data() : null;
    } else {
      return this.localCache.get(`${collection}_${id}`) || null;
    }
  }
}

export default new DatabaseService();
