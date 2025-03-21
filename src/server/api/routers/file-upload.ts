import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { fileUploads, pastes } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { fileManager } from "@/lib/file-manager";

export const fileUploadRouter = createTRPCRouter({
  // Get files associated with a paste
  getByPasteId: publicProcedure
    .input(z.object({ pasteId: z.string() }))
    .query(async ({ ctx, input }) => {
      const files = await ctx.db.query.fileUploads.findMany({
        where: eq(fileUploads.pasteId, input.pasteId),
      });

      return files;
    }),

  // Delete a file upload
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Use the fileManager to handle deletion
      const result = await fileManager.deleteFile(input.id, ctx.session.user.id);
      
      return { success: result };
    }),

  // Pre-sign URL for file upload (this would be implemented with real file storage)
  getUploadUrl: publicProcedure
    .input(
      z.object({
        pasteId: z.string(),
        fileName: z.string(),
        fileType: z.string(),
        fileSize: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if paste exists
      const paste = await ctx.db.query.pastes.findFirst({
        where: eq(pastes.id, input.pasteId),
      });

      if (!paste) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Paste not found",
        });
      }

      // For authenticated users, check if they own the paste
      if (ctx.session?.user && paste.userId && paste.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to add files to this paste",
        });
      }

      // Generate a unique ID for the file
      const fileId = nanoid(10);
      const storageKey = `uploads/${input.pasteId}/${fileId}-${input.fileName}`;

      // In a real implementation, we would generate a pre-signed URL here
      // For now, we'll just create a record in the database
      await ctx.db.insert(fileUploads).values({
        id: fileId,
        pasteId: input.pasteId,
        filename: input.fileName,
        fileType: input.fileType,
        fileSize: input.fileSize,
        storageKey,
      });

      // Return a mock upload URL (this would be a real pre-signed URL in production)
      return {
        fileId,
        uploadUrl: `/api/mock-upload/${storageKey}`,
      };
    }),
}); 