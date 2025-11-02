import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Debug: Log environment variables
console.log("📋 Environment Variables Check:");
console.log(
  "  API_KEY:",
  process.env.VUE_APP_FIREBASE_API_KEY ? "✓ loaded" : "✗ missing"
);
console.log(
  "  AUTH_DOMAIN:",
  process.env.VUE_APP_FIREBASE_AUTH_DOMAIN ? "✓ loaded" : "✗ missing"
);
console.log(
  "  PROJECT_ID:",
  process.env.VUE_APP_FIREBASE_PROJECT_ID ? "✓ loaded" : "✗ missing"
);

const firebaseConfig = {
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_FIREBASE_APP_ID,
};

// Validate config before initializing
if (!firebaseConfig.apiKey) {
  console.error("❌ Firebase config is missing! Check .env.local file");
  console.error("Config:", firebaseConfig);
  throw new Error("Firebase configuration not found");
}

console.log("✅ Firebase config loaded successfully");
console.log("   Project:", firebaseConfig.projectId);

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
