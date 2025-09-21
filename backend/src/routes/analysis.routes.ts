//backend -> src -> routes -> analysis.routes.ts
import { Router } from "express";
import multer from "multer";
import { createAnalysis } from "../controllers/analysis.controller.js";

const router = Router();

// Configure multer for in-memory storage (it gives us a buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define the route: POST /api/analysis
// 'upload.array('documents', 10)' means we expect up to 10 files in a field named 'documents'
router.post("/", upload.array("documents", 10), createAnalysis);

export default router;
