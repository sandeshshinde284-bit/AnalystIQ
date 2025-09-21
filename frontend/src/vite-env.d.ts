// C:\Google-Hack\Projects\AnalystIQ\frontend\src\vite-env.d.ts

/// <reference types="node" />

// Vue CLI Environment Variables
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: "development" | "production" | "test";
    readonly BASE_URL: string;
    readonly VUE_APP_API_BASE_URL: string;
    readonly VUE_APP_FIREBASE_API_KEY: string;
    readonly VUE_APP_FIREBASE_AUTH_DOMAIN: string;
    readonly VUE_APP_FIREBASE_PROJECT_ID: string;
    readonly VUE_APP_FIREBASE_STORAGE_BUCKET: string;
    readonly VUE_APP_FIREBASE_MESSAGING_SENDER_ID: string;
    readonly VUE_APP_FIREBASE_APP_ID: string;
    readonly VUE_APP_GOOGLE_CLOUD_PROJECT_ID: string;
    readonly VUE_APP_GOOGLE_CLOUD_LOCATION: string;
    readonly VUE_APP_GEMINI_API_KEY: string;
    readonly VUE_APP_GEMINI_MODEL: string;
    readonly VUE_APP_DOCUMENT_AI_PROCESSOR_ID: string;
    readonly VUE_APP_DOCUMENT_AI_LOCATION: string;
    readonly VUE_APP_BIGQUERY_DATASET: string;
    readonly VUE_APP_AGENT_BUILDER_ENGINE_ID: string;
  }
}
