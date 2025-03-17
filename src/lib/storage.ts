// Storage service abstraction for file uploads
import { put, del } from '@vercel/blob';

export interface UploadOptions {
  access?: 'public'
  addRandomSuffix?: boolean;
  // Add other options that might be needed for other providers
}

export interface UploadResult {
  url: string;
  uploadedAt: string;
  filename: string;
  pasteId?: string;
}

/**
 * Storage service for file uploads
 * Current implementation uses Vercel Blob
 * Can be swapped with other providers like S3, Blackblaze, or Supabase
 */
export class StorageService {
  /**
   * Upload a file to storage
   * @param filename The name of the file
   * @param file The file to upload
   * @param options Upload options
   * @returns Upload result with URL and metadata
   */
  async uploadFile(
    filename: string,
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    // Using Vercel Blob for now
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: options.addRandomSuffix ?? false,
    });

    return {
      url: blob.url,
      uploadedAt: new Date().toISOString(),
      filename: filename,
      pasteId: undefined,
    };
  }

  /**
   * Delete a file from storage
   * @param url The URL of the file to delete
   * @returns A promise that resolves when the file is deleted
   */
  async deleteFile(url: string): Promise<void> {
    // Using Vercel Blob for now
    await del(url);
  }
}

// Export a singleton instance
export const storageService = new StorageService(); 