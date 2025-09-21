// backend -> src -> config -> env.ts
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force load .env from multiple possible locations
const envPaths = [
  path.join(__dirname, "../../.env"),
  path.join(__dirname, "../.env"),
  path.join(process.cwd(), ".env"),
];

for (const envPath of envPaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (result.parsed) {
      console.log(`✅ Environment loaded from: ${envPath}`);
      console.log(`✅ Loaded ${Object.keys(result.parsed).length} variables`);
      break;
    }
  } catch (error) {
    console.log(`❌ Failed to load from: ${envPath}`);
  }
}

// Verify key variables
const testVars = [
  "GOOGLE_CLOUD_PROJECT_ID",
  "FIREBASE_PROJECT_ID",
  "GEMINI_API_KEY",
];
console.log("🔍 Environment verification:");
testVars.forEach((varName) => {
  const value = process.env[varName];
  console.log(
    `${value ? "✅" : "❌"} ${varName}: ${value ? "LOADED" : "MISSING"}`
  );
});
