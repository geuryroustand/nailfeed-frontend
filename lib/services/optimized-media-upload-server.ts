"use server";

/**
 * Server-side media upload utilities for Strapi v5
 * This module contains server-only functions for media upload operations
 * Following Next.js server actions best practices - only async functions exported
 */

import { API_URL } from "../config";

/**
 * Upload media files directly to a post using Strapi v5 ref/refId/field parameters
 * Server action for uploading media with automatic relations
 */
export async function uploadMediaToPost(
  files: File[],
  postId: string,
  token: string
): Promise<any[]> {
  if (!files.length || !postId) {
    throw new Error("Files and post ID are required");
  }

  console.log(
    `[Server] uploadMediaToPost: Uploading ${files.length} files to post ${postId}`
  );

  const formData = new FormData();

  // Add files
  files.forEach((file, index) => {
    formData.append("files", file, `${index}-${file.name}`);
  });

  // Strapi v5 relation parameters for direct media attachment
  formData.append("ref", "api::post.post");
  formData.append("refId", postId);
  formData.append("field", "media"); // Direct media field

  // Debug: Log the relation parameters
  console.log("[Server] uploadMediaToPost: Relation parameters:", {
    ref: "api::post.post",
    refId: postId,
    field: "media"
  });

  try {
    const uploadUrl = `${API_URL}/api/upload`;

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Failed to upload media to post (status ${response.status}): ${
          errorText || response.statusText
        }`
      );
    }

    const uploadedFiles = await response.json();
    console.log(
      "[Server] uploadMediaToPost: Upload successful:",
      uploadedFiles
    );

    return Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];
  } catch (error) {
    console.error("[Server] uploadMediaToPost: Upload failed:", error);
    throw error;
  }
}

/**
 * Validate files before upload
 * Returns valid files and error messages for invalid ones
 * Pure function - can be used in server actions
 */
export async function validateFiles(
  files: File[],
  options: {
    maxFileSize?: number; // in bytes
    allowedTypes?: string[];
    maxFiles?: number;
  } = {}
): Promise<{
  validFiles: File[];
  errors: string[];
}> {
  console.log("[Server] validateFiles called with:", {
    filesType: typeof files,
    isArray: Array.isArray(files),
    length: files?.length
  });

  // Handle edge cases
  if (!files) {
    console.warn("[Server] validateFiles: files is null/undefined");
    return { validFiles: [], errors: ["No files provided"] };
  }

  if (!Array.isArray(files)) {
    console.warn("[Server] validateFiles: files is not an array", typeof files);
    return { validFiles: [], errors: ["Invalid files format - expected array"] };
  }

  const {
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
    maxFiles = 10,
  } = options;

  const validFiles: File[] = [];
  const errors: string[] = [];

  if (files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} files allowed`);
    return { validFiles: [], errors };
  }

  for (const file of files) {
    if (file.size > maxFileSize) {
      errors.push(
        `File "${file.name}" exceeds maximum size of ${Math.round(
          maxFileSize / 1024 / 1024
        )}MB`
      );
      continue;
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(`File "${file.name}" has unsupported type: ${file.type}`);
      continue;
    }

    validFiles.push(file);
  }

  return { validFiles, errors };
}

/**
 * Retry upload with exponential backoff
 * Server action for handling upload retries
 */
export async function uploadWithRetry(
  uploadFunction: () => Promise<any[]>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFunction();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(
        `[Server] uploadWithRetry: Retry attempt ${attempt} failed, retrying in ${delay}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Upload failed after retries");
}
