// Simple Vite environment declarations without importing vite/client
declare const __DEV__: boolean;
declare const __PROD__: boolean;

declare namespace ImportMeta {
  interface Env {
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly PROD: boolean;
    readonly DEV: boolean;
    readonly SSR: boolean;

    // Custom environment variables
    readonly VITE_FIREBASE_API_KEY?: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
    readonly VITE_FIREBASE_DATABASE_URL?: string;
    readonly VITE_FIREBASE_PROJECT_ID?: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
    readonly VITE_FIREBASE_APP_ID?: string;
    readonly VITE_GOOGLE_CLOUD_PROJECT_ID?: string;
    readonly VITE_GOOGLE_CLOUD_LOCATION?: string;
    readonly VITE_GEMINI_API_KEY?: string;
    readonly VITE_GEMINI_MODEL?: string;
    readonly VITE_DOCUMENT_AI_PROCESSOR_ID?: string;
    readonly VITE_DOCUMENT_AI_LOCATION?: string;
    readonly VITE_BIGQUERY_DATASET?: string;
    readonly VITE_AGENT_BUILDER_ENGINE_ID?: string;

    readonly [key: string]: any;
  }
}

declare interface ImportMeta {
  readonly env: ImportMeta.Env;
}
