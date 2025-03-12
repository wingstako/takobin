import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { pastes, fileUploads } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import { add } from "date-fns";
import { hash, compare } from "bcryptjs";

const GUEST_MAX_EXPIRY_DAYS = 7;
const USER_MAX_EXPIRY_DAYS = 30;

export const pasteRouter = createTRPCRouter({
  // Create a new paste
  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        language: z.string().min(1).max(50).default("plaintext"),
        password: z.string().optional(),
        expiryDays: z.number().int().min(1).max(USER_MAX_EXPIRY_DAYS).default(7),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = nanoid(10);
      
      // Calculate expiry date based on user status
      const maxDays = ctx.session?.user ? USER_MAX_EXPIRY_DAYS : GUEST_MAX_EXPIRY_DAYS;
      const expiryDays = Math.min(input.expiryDays, maxDays);
      const expiresAt = add(new Date(), { days: expiryDays });
      
      // Hash password if provided
      let hashedPassword = null;
      if (input.password) {
        hashedPassword = await hash(input.password, 10);
      }

      // Insert paste into database
      await ctx.db.insert(pastes).values({
        id,
        title: input.title,
        content: input.content,
        language: input.language,
        expiresAt,
        isProtected: !!input.password,
        password: hashedPassword,
        userId: ctx.session?.user?.id,
      });

      return { id };
    }),

  // Get a paste by ID
  getById: publicProcedure
    .input(
      z.object({
        id: z.string().min(1),
        password: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const paste = await ctx.db.query.pastes.findFirst({
        where: eq(pastes.id, input.id),
      });

      if (!paste) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Paste not found",
        });
      }

      // Check if paste is expired
      if (new Date() > paste.expiresAt) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Paste has expired",
        });
      }

      // Check if paste is password protected
      if (paste.isProtected && paste.password) {
        // If no password was provided in the request
        if (!input.password) {
          return {
            id: paste.id,
            title: paste.title,
            isProtected: true,
            language: paste.language,
            expiresAt: paste.expiresAt,
            userId: paste.userId,
            createdAt: paste.createdAt,
            // Don't return the content if password protected
            content: null,
          };
        }

        // Verify password
        const passwordMatches = await compare(input.password, paste.password);
        if (!passwordMatches) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Incorrect password",
          });
        }
      }

      // Update last accessed time
      const maxExpiryDays = paste.userId ? USER_MAX_EXPIRY_DAYS : GUEST_MAX_EXPIRY_DAYS;
      const newExpiresAt = add(new Date(), { days: maxExpiryDays });
      
      await ctx.db
        .update(pastes)
        .set({ 
          lastAccessedAt: new Date(),
          expiresAt: newExpiresAt,
        })
        .where(eq(pastes.id, input.id));

      return paste;
    }),

  // Get user's pastes (for authenticated users)
  getUserPastes: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      const offset = (page - 1) * limit;

      const userPastes = await ctx.db.query.pastes.findMany({
        where: eq(pastes.userId, ctx.session.user.id),
        orderBy: [desc(pastes.createdAt)],
        limit,
        offset,
      });

      const totalCount = await ctx.db
        .select({ count: count() })
        .from(pastes)
        .where(eq(pastes.userId, ctx.session.user.id));

      return {
        pastes: userPastes,
        pagination: {
          total: totalCount[0]?.count ?? 0,
          page,
          limit,
        },
      };
    }),

  // Delete a paste
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const paste = await ctx.db.query.pastes.findFirst({
        where: eq(pastes.id, input.id),
      });

      if (!paste) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Paste not found",
        });
      }

      // Ensure user owns the paste
      if (paste.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this paste",
        });
      }

      await ctx.db.delete(pastes).where(eq(pastes.id, input.id));

      return { success: true };
    }),

  // Delete all pastes for the current user (PANIC DELETE)
  deleteAllUserPastes: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        });
      }

      // Delete all pastes for this user
      const result = await ctx.db.delete(pastes).where(eq(pastes.userId, userId));

      return { 
        success: true,
        message: "All your pastes have been deleted" 
      };
    }),

  // Update a paste
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(255).optional(),
        content: z.string().min(1).optional(),
        language: z.string().min(1).max(50).optional(),
        password: z.string().optional(),
        removePassword: z.boolean().optional(),
        expiryDays: z.number().int().min(1).max(USER_MAX_EXPIRY_DAYS).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const paste = await ctx.db.query.pastes.findFirst({
        where: eq(pastes.id, input.id),
      });

      if (!paste) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Paste not found",
        });
      }

      // Ensure user owns the paste
      if (paste.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this paste",
        });
      }

      const updateData: Record<string, unknown> = {};

      if (input.title) updateData.title = input.title;
      if (input.content) updateData.content = input.content;
      if (input.language) updateData.language = input.language;
      
      // Update expiry if specified
      if (input.expiryDays) {
        updateData.expiresAt = add(new Date(), { 
          days: Math.min(input.expiryDays, USER_MAX_EXPIRY_DAYS) 
        });
      }

      // Handle password changes
      if (input.password) {
        updateData.isProtected = true;
        updateData.password = await hash(input.password, 10);
      } else if (input.removePassword) {
        updateData.isProtected = false;
        updateData.password = null;
      }

      await ctx.db
        .update(pastes)
        .set(updateData)
        .where(eq(pastes.id, input.id));

      return { success: true };
    }),
}); 