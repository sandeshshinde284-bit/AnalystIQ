// backend -> src -> config -> googleCloud.ts
import admin from "firebase-admin";
import type { ServiceAccount } from "firebase-admin";

// Environment variable helper
const getEnvVar = (key: string, fallback = ""): string => {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    console.warn(`⚠️ Environment variable ${key} is missing or empty`);
    return fallback;
  }
  return value;
};

// Google Cloud configuration interface
export interface GoogleCloudConfig {
  projectId: string;
  location: string;
  firebase: {
    projectId: string;
    privateKeyId: string;
    privateKey: string;
    clientEmail: string;
    clientId: string;
    storageBucket: string;
  };
  gemini: {
    apiKey: string;
    model: string;
  };
  documentAI: {
    processorId: string;
    location: string;
  };
  cloudVision: {
    enabled: boolean;
  };
  bigQuery: {
    dataset: string;
    tables: {
      startups: string;
      metrics: string;
      benchmarks: string;
    };
  };
  agentBuilder: {
    engineId: string;
    dataStoreId: string;
  };
  storage: {
    buckets: {
      documents: string;
      processed: string;
      reports: string;
    };
  };
  vertexAI: {
    location: string;
    model: string;
  };
}

export const googleCloudConfig: GoogleCloudConfig = {
  projectId: getEnvVar("GOOGLE_CLOUD_PROJECT_ID"),
  location: getEnvVar("GOOGLE_CLOUD_LOCATION", "us-central1"),
  firebase: {
    projectId: getEnvVar("FIREBASE_PROJECT_ID"),
    privateKeyId: getEnvVar("FIREBASE_PRIVATE_KEY_ID"),
    privateKey: getEnvVar("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    clientEmail: getEnvVar("FIREBASE_CLIENT_EMAIL"),
    clientId: getEnvVar("FIREBASE_CLIENT_ID"),
    storageBucket: getEnvVar("FIREBASE_STORAGE_BUCKET"),
  },
  gemini: {
    apiKey: getEnvVar("GEMINI_API_KEY"),
    model: getEnvVar("GEMINI_MODEL", "gemini-1.5-pro"),
  },
  documentAI: {
    processorId: getEnvVar("DOCUMENT_AI_PROCESSOR_ID"),
    location: getEnvVar("DOCUMENT_AI_LOCATION", "us"),
  },
  cloudVision: {
    enabled: true,
  },
  bigQuery: {
    dataset: getEnvVar("BIGQUERY_DATASET", "investment_analytics"),
    tables: {
      startups: "startup_data",
      metrics: "investment_metrics",
      benchmarks: "market_benchmarks",
    },
  },
  agentBuilder: {
    engineId: getEnvVar("AGENT_BUILDER_ENGINE_ID"),
    dataStoreId: "investment-knowledge-base",
  },
  storage: {
    buckets: {
      documents: `${getEnvVar("GOOGLE_CLOUD_PROJECT_ID")}-documents`,
      processed: `${getEnvVar("GOOGLE_CLOUD_PROJECT_ID")}-processed`,
      reports: `${getEnvVar("GOOGLE_CLOUD_PROJECT_ID")}-reports`,
    },
  },
  vertexAI: {
    location: getEnvVar("VERTEX_AI_LOCATION", "us-central1"),
    model: getEnvVar("VERTEX_AI_MODEL", "text-bison-001"),
  },
};

// Firebase Admin initialization with proper types
let app: admin.app.App | null = null;
let db: admin.firestore.Firestore | null = null;
let storage: admin.storage.Storage | null = null;
let auth: admin.auth.Auth | null = null;

// Initialize Firebase Admin SDK
const initializeFirebase = (): void => {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      app = admin.apps[0];
      console.log("✅ Using existing Firebase Admin app");
    } else if (
      googleCloudConfig.firebase.projectId &&
      googleCloudConfig.firebase.privateKey &&
      googleCloudConfig.firebase.clientEmail
    ) {
      // Create proper ServiceAccount object (without 'type' property)
      const serviceAccount: ServiceAccount = {
        projectId: googleCloudConfig.firebase.projectId,
        privateKey: googleCloudConfig.firebase.privateKey,
        clientEmail: googleCloudConfig.firebase.clientEmail,
      };

      // Initialize Firebase Admin
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: googleCloudConfig.firebase.projectId,
        storageBucket: googleCloudConfig.firebase.storageBucket,
      });

      console.log("✅ Firebase Admin initialized successfully");
    } else {
      console.warn(
        "⚠️ Firebase credentials incomplete - running without Firebase"
      );
    }

    // Initialize services if app exists
    if (app) {
      db = admin.firestore();
      storage = admin.storage();
      auth = admin.auth();
    }
  } catch (error) {
    console.warn("⚠️ Firebase Admin initialization failed:", error);
    app = null;
    db = null;
    storage = null;
    auth = null;
  }
};

// Initialize Firebase on module load
initializeFirebase();

// Export Firebase instances
export { app, db, storage, auth };

// Helper functions
export const getProjectId = (): string => googleCloudConfig.projectId;
export const getLocation = (): string => googleCloudConfig.location;

// Check if Firebase is available
export const isFirebaseAvailable = (): boolean => {
  return !!(app && db);
};

// Get Firebase app instance safely
export const getFirebaseApp = (): admin.app.App | null => {
  return app;
};

// Get Firestore instance safely
export const getFirestore = (): admin.firestore.Firestore | null => {
  return db;
};

// Get Storage instance safely
export const getStorage = (): admin.storage.Storage | null => {
  return storage;
};

// Get Auth instance safely
export const getAuth = (): admin.auth.Auth | null => {
  return auth;
};

// Validate configuration
export const validateGoogleCloudConfig = (): boolean => {
  try {
    console.log("🔍 Validating Google Cloud configuration...");

    const checks = [
      { name: "GOOGLE_CLOUD_PROJECT_ID", value: googleCloudConfig.projectId },
      {
        name: "FIREBASE_PROJECT_ID",
        value: googleCloudConfig.firebase.projectId,
      },
      {
        name: "FIREBASE_CLIENT_EMAIL",
        value: googleCloudConfig.firebase.clientEmail,
      },
      {
        name: "FIREBASE_PRIVATE_KEY",
        value: googleCloudConfig.firebase.privateKey,
      },
    ];

    let validCount = 0;
    checks.forEach((check) => {
      if (check.value && check.value.trim().length > 0) {
        console.log(`✅ ${check.name}: OK`);
        validCount++;
      } else {
        console.log(`❌ ${check.name}: MISSING`);
      }
    });

    const isValid = validCount === checks.length;
    console.log(
      `🔍 Validation result: ${validCount}/${checks.length} fields valid`
    );

    return isValid;
  } catch (error) {
    console.error("Google Cloud configuration validation failed:", error);
    return false;
  }
};

// Export default
export default {
  config: googleCloudConfig,
  app,
  db,
  storage,
  auth,
  isAvailable: isFirebaseAvailable(),
};

// Validate configuration on initialization
if (!validateGoogleCloudConfig()) {
  console.warn(
    "⚠️ Google Cloud configuration incomplete - some features may not work"
  );
}
