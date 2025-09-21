// backend -> src - > controllers -> analysis.controller.ts
import { Request, Response } from "express";
import analysisService from "../services/analysis.service.js";
import { UploadedFile } from "../types/index.js";

export const createAnalysis = async (req: Request, res: Response) => {
  try {
    // Multer puts the uploaded files in req.files
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ message: "No files uploaded." });
    }

    // Adapt the files from Multer's format to our 'UploadedFile' format
    const uploadedFiles: UploadedFile[] = (
      req.files as Express.Multer.File[]
    ).map((file) => ({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      fieldname: file.fieldname,
    }));

    // For now, let's assume userId comes from a decoded token in middleware later
    const userId = "temp-user-id"; // req.user.id;

    // Call your existing service!
    const result = await analysisService.processAnalysis(
      uploadedFiles,
      undefined,
      userId
    );

    res.status(201).json(result);
  } catch (error) {
    console.error("Analysis controller error:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({ message });
  }
};
