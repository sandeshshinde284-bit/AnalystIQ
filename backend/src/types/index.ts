//backend -> src -> types -> index.ts

/**
 * This file contains shared TypeScript interfaces and types used across multiple
 * services in the application. Centralizing them here provides a single source
 * of truth and avoids code duplication.
 */

// Represents the file object provided by an upload middleware like 'multer'.
// This is the standard format our services will expect for file uploads.
export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  fieldname?: string; // The form field name specified in the multipart request.
}

// A standardized function signature for reporting progress during long operations.
export interface ProgressCallback {
  (message: string, progress: number): void;
}

// Defines the standardized categories for document classification.
export type DocumentType =
  | "pitchDeck"
  | "financialModel"
  | "founderProfiles"
  | "marketResearch"
  | "tractionData"
  | "document";
