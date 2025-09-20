import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import * as admin from "firebase-admin";

// Server-side environment interface
interface ServerEnv {
  readonly GOOGLE_CLOUD_PROJECT_ID: string;
  readonly GOOGLE_CLOUD_LOCATION: string;
  readonly FIREBASE_PROJECT_ID: string;
  readonly FIREBASE_PRIVATE_KEY_ID: string;
  readonly FIREBASE_PRIVATE_KEY: string;
  readonly FIREBASE_CLIENT_EMAIL: string;
  readonly FIREBASE_CLIENT_ID: string;
  readonly FIREBASE_STORAGE_BUCKET: string;
  readonly GEMINI_API_KEY: string;
  readonly GEMINI_MODEL: string;
  readonly DOCUMENT_AI_PROCESSOR_ID: string;
  readonly DOCUMENT_AI_LOCATION: string;
  readonly BIGQUERY_DATASET: string;
  readonly AGENT_BUILDER_ENGINE_ID: string;
  readonly VERTEX_AI_LOCATION: string;
  readonly VERTEX_AI_MODEL: string;
}

// Safe environment variable access
const getEnvVar = (key: keyof ServerEnv, fallback = ""): string => {
  return process.env[key] || fallback;
};

// Google Cloud configuration
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

// Firebase Admin initialization
let app: admin.app.App | null = null;
let db: admin.firestore.Firestore | null = null;
let storage: admin.storage.Storage | null = null;
let auth: admin.auth.Auth | null = null;

try {
  if (!getApps().length && googleCloudConfig.firebase.projectId) {
    const serviceAccount = {
      type: "service_account",
      project_id: googleCloudConfig.firebase.projectId,
      private_key_id: googleCloudConfig.firebase.privateKeyId,
      private_key: googleCloudConfig.firebase.privateKey,
      client_email: googleCloudConfig.firebase.clientEmail,
      client_id: googleCloudConfig.firebase.clientId,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${googleCloudConfig.firebase.clientEmail}`,
    };

    app = initializeApp({
      credential: cert(serviceAccount as admin.ServiceAccount),
      projectId: googleCloudConfig.firebase.projectId,
      storageBucket: googleCloudConfig.firebase.storageBucket,
    });

    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);

    console.log("✅ Firebase Admin initialized successfully");
  } else if (getApps().length > 0) {
    app = getApps()[0] as admin.app.App;
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
  }
} catch (error) {
  console.warn("⚠️ Firebase Admin initialization failed:", error);
}

// Export Firebase instances
export { app, db, storage, auth };

// Helper functions
export const getProjectId = (): string => googleCloudConfig.projectId;
export const getLocation = (): string => googleCloudConfig.location;

// Check if Firebase is available
export const isFirebaseAvailable = (): boolean => {
  return !!(app && db);
};

// Validate configuration
export const validateGoogleCloudConfig = (): boolean => {
  try {
    const requiredFields = [
      googleCloudConfig.projectId,
      googleCloudConfig.firebase.projectId,
      googleCloudConfig.firebase.clientEmail,
      googleCloudConfig.firebase.privateKey,
    ];

    return requiredFields.every((field) => !!field);
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

// Initialize validation
if (!validateGoogleCloudConfig()) {
  console.warn(
    "⚠️ Google Cloud configuration incomplete - some features may not work"
  );
}
