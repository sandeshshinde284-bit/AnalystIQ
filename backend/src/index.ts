// BACKEND -> SRC -> INDEX.TS

import "./config/env.js";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

// Use relative imports instead of @/ aliases for now
import analysisRoutes from "./routes/analysis.routes.js";
import databaseService from "./services/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ServerConfig {
  port: number;
  environment: string;
  corsOrigin: string;
  rateLimitWindow: number;
  rateLimitMax: number;
}

class AnalysisIQServer {
  private app: express.Application;
  private server: any;
  private config: ServerConfig;

  constructor() {
    this.config = {
      port: parseInt(process.env["PORT"] || "5000"),
      environment: process.env["NODE_ENV"] || "development",
      corsOrigin: process.env["CORS_ORIGIN"] || "http://localhost:8080", // Fixed CORS
      rateLimitWindow: parseInt(
        process.env["RATE_LIMIT_WINDOW_MS"] || "900000"
      ),
      rateLimitMax: parseInt(process.env["RATE_LIMIT_MAX_REQUESTS"] || "100"),
    };

    this.app = express();
    this.server = createServer(this.app);

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      })
    );

    // CORS configuration - Allow multiple origins
    this.app.use(
      cors({
        origin: [
          "http://localhost:8080",
          "http://localhost:5173",
          "http://localhost:3000",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      })
    );

    // Body parsing
    this.app.use(express.json({ limit: "50mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "50mb" }));

    // Logging middleware (move before routes)
    this.app.use((req, res, next) => {
      console.log(
        `${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`
      );
      next();
    });

    // Mount API routes
    this.app.use("/api/analysis", analysisRoutes);
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get("/api/health", async (req, res) => {
      try {
        const dbHealth = await databaseService.healthCheck();

        const healthStatus = {
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: process.env["npm_package_version"] || "1.0.0",
          environment: this.config.environment,
          services: {
            database: dbHealth ? "healthy" : "degraded",
            mode: databaseService.getMode(),
          },
        };

        res.status(200).json(healthStatus);
      } catch (error) {
        res.status(503).json({
          status: "unhealthy",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
      }
    });

    // API status endpoint
    this.app.get("/api/status", (req, res) => {
      res.json({
        message: "AnalysisIQ Backend API is running",
        version: "1.0.0",
        endpoints: {
          health: "/health",
          status: "/api/status",
          analysis: "/api/analysis",
        },
      });
    });

    // Debug endpoint
    this.app.get("/api/debug-env", (req, res) => {
      res.json({
        hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasDocumentAI: !!process.env.DOCUMENT_AI_PROCESSOR_ID,
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        geminiKey: process.env.GEMINI_API_KEY ? "SET" : "NOT_SET",
      });
    });

    // Test services endpoint
    this.app.get("/api/test-services", async (req, res) => {
      try {
        const dbTest = await databaseService.healthCheck();

        const results = {
          database: dbTest,
          timestamp: new Date().toISOString(),
          message: "Basic service test completed",
        };

        res.json(results);
      } catch (error) {
        res.status(500).json({
          error: "Service test failed",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    // 404 handler (keep at end)
    this.app.use((req, res) => {
      res.status(404).json({
        error: "Route not found",
        message: `Cannot ${req.method} ${req.originalUrl}`,
        availableEndpoints: [
          "/health",
          "/api/status",
          "/api/test-services",
          "/api/analysis",
        ],
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        console.error("Global error handler:", err);

        const statusCode = err.statusCode || 500;
        const message = err.message || "Internal server error";

        res.status(statusCode).json({
          error: message,
          ...(this.config.environment === "development" && {
            stack: err.stack,
          }),
          timestamp: new Date().toISOString(),
        });
      }
    );
  }

  public async start(): Promise<void> {
    try {
      console.log("🔍 Testing database connection...");
      const dbHealthy = await databaseService.healthCheck();
      console.log(
        `📊 Database status: ${
          dbHealthy ? "✅ Healthy" : "⚠️ Degraded"
        } (${databaseService.getMode()} mode)`
      );

      this.server.listen(this.config.port, () => {
        console.log("\n🚀 AnalysisIQ Backend Server Started!");
        console.log(`📍 Port: ${this.config.port}`);
        console.log(`🌍 Environment: ${this.config.environment}`);
        console.log(
          `🔗 CORS Origins: http://localhost:8080, http://localhost:5173`
        );
        console.log(`📊 Database Mode: ${databaseService.getMode()}`);
        console.log(`\n📋 Available Endpoints:`);
        console.log(
          `   Health Check: http://localhost:${this.config.port}/health`
        );
        console.log(
          `   API Status:   http://localhost:${this.config.port}/api/status`
        );
        console.log(
          `   Test Services: http://localhost:${this.config.port}/api/test-services`
        );
        console.log(
          `   Analysis API: http://localhost:${this.config.port}/api/analysis`
        );
        console.log("\n✅ Backend ready to receive requests!\n");
      });

      process.on("SIGTERM", this.shutdown.bind(this));
      process.on("SIGINT", this.shutdown.bind(this));
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  }

  private shutdown(): void {
    console.log("\n🛑 Shutting down server gracefully...");
    this.server.close(() => {
      console.log("✅ Server closed");
      process.exit(0);
    });
  }
}

// Error handling
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Start the server
const server = new AnalysisIQServer();
server.start().catch((error) => {
  console.error("❌ Failed to start AnalysisIQ server:", error);
  process.exit(1);
});

export default AnalysisIQServer;
