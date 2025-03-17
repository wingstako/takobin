import { db } from "@/server/db";
import { fileUploads, pastes } from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import { storageService } from "./storage";
import { TRPCError } from "@trpc/server";

/**
 * Manages file operations at a higher level, coordinating between
 * database operations and storage operations
 */
export class FileManager {
  /**
   * Delete a file by its ID
   * @param fileId The ID of the file to delete
   * @param userId The ID of the user making the request (for authorization)
   */
  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    // Get file info from database
    const file = await db.query.fileUploads.findFirst({
      where: eq(fileUploads.id, fileId),
      with: {
        paste: true,
      },
    });

    if (!file) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "File not found",
      });
    }

    // Check if user owns the file
    if (file.paste.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to delete this file",
      });
    }

    // Delete file from storage if URL exists
    if (file.storageKey) {
      try {
        await storageService.deleteFile(file.storageKey);
      } catch (error) {
        console.error("Error deleting file from storage:", error);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    await db.delete(fileUploads).where(eq(fileUploads.id, fileId));

    return true;
  }

  /**
   * Delete all files associated with a paste
   * @param pasteId The ID of the paste
   * @param userId The ID of the user making the request (for authorization)
   */
  async deleteFilesByPasteId(pasteId: string, userId: string): Promise<number> {
    // Get all files for the paste
    const files = await db.query.fileUploads.findMany({
      where: eq(fileUploads.pasteId, pasteId),
      with: {
        paste: true,
      },
    });

    if (files.length === 0) {
      return 0;
    }

    // Check ownership of the first file's paste (they should all have the same paste)
    const firstFile = files[0];
    if (firstFile && firstFile.paste.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to delete these files",
      });
    }

    // Delete each file from storage
    for (const file of files) {
      if (file.storageKey) {
        try {
          await storageService.deleteFile(file.storageKey);
        } catch (error) {
          console.error(`Error deleting file ${file.id} from storage:`, error);
          // Continue with next file even if this one fails
        }
      }
    }

    // Delete all files from database
    await db.delete(fileUploads).where(eq(fileUploads.pasteId, pasteId));

    return files.length;
  }

  /**
   * Delete all files for a user
   * @param userId The ID of the user
   */
  async deleteAllUserFiles(userId: string): Promise<number> {
    // First get all paste IDs owned by this user
    const userPastes = await db.query.pastes.findMany({
      where: eq(pastes.userId, userId),
      columns: {
        id: true
      }
    });
    
    const pasteIds = userPastes.map(paste => paste.id);
    
    if (pasteIds.length === 0) {
      return 0;
    }
    
    // Now get all files associated with these pastes
    const files = await db.query.fileUploads.findMany({
      where: inArray(fileUploads.pasteId, pasteIds),
    });

    if (files.length === 0) {
      return 0;
    }

    // Delete each file from storage
    for (const file of files) {
      if (file.storageKey) {
        try {
          await storageService.deleteFile(file.storageKey);
        } catch (error) {
          console.error(`Error deleting file ${file.id} from storage:`, error);
          // Continue with next file even if this one fails
        }
      }
    }

    // Delete all files from database for this user's pastes
    await db.delete(fileUploads).where(inArray(fileUploads.pasteId, pasteIds));

    return files.length;
  }
}

// Export a singleton instance
export const fileManager = new FileManager(); 