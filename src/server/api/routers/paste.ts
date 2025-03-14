import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { pastes, fileUploads } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { add } from "date-fns";
import { hash, compare } from "bcryptjs";

// Constants for paste expiry
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
        expiryDays: z.number().int().min(1).max(USER_MAX_EXPIRY_DAYS).default(7).optional(),
        neverExpire: z.boolean().optional(),
        expiryDate: z.date().optional(),
        visibility: z.enum(["public", "private"]).default("public"),
        pasteType: z.enum(["text", "multimedia"]).default("text"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = nanoid(10);
      
      // Calculate expiry date based on user status and input
      let expiresAt = null;
      
      // Only set expiry if not "never expire" and user is authenticated or using default expiry
      if (!input.neverExpire) {
        if (input.expiryDate) {
          // For date picker input
          expiresAt = input.expiryDate;
        } else if (input.expiryDays) {
          // For backward compatibility
          const maxDays = ctx.session?.user ? USER_MAX_EXPIRY_DAYS : GUEST_MAX_EXPIRY_DAYS;
          const expiryDays = Math.min(input.expiryDays, maxDays);
          expiresAt = add(new Date(), { days: expiryDays });
        } else {
          // Default expiry is 7 days
          expiresAt = add(new Date(), { days: 7 });
        }
      }
      
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
        visibility: input.visibility,
        pasteType: input.pasteType,
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
      if (paste.expiresAt && new Date() > paste.expiresAt) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Paste has expired",
        });
      }

      // Check if paste is private and user is not the creator
      if (paste.visibility === "private" && paste.userId !== ctx.session?.user?.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This paste is private and can only be accessed by its creator",
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
            visibility: paste.visibility,
            expiresAt: paste.expiresAt,
            userId: paste.userId,
            createdAt: paste.createdAt,
            // Don't return the content if password protected
            content: null,
            pasteType: paste.pasteType,
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
      // const maxExpiryDays = paste.userId ? USER_MAX_EXPIRY_DAYS : GUEST_MAX_EXPIRY_DAYS;
      // const newExpiresAt = add(new Date(), { days: maxExpiryDays });
      
      await ctx.db
        .update(pastes)
        .set({ 
          lastAccessedAt: new Date(),
          // expiresAt: newExpiresAt,
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
        id: z.string().min(1),
        title: z.string().min(1).max(255).optional(),
        content: z.string().min(1).optional(),
        language: z.string().min(1).max(50).optional(),
        expiryDate: z.date().optional(),
        neverExpire: z.boolean().optional(),
        password: z.string().optional(),
        removePassword: z.boolean().optional(),
        visibility: z.enum(["public", "private"]).optional(),
        pasteType: z.enum(["text", "multimedia"]).optional(),
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

      if (paste.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this paste",
        });
      }

      let expiresAt = null;

      if (input.neverExpire) {
        expiresAt = null;
      } else if (input.expiryDate) {
        expiresAt = input.expiryDate;
      } else if (paste.expiresAt) {
        expiresAt = paste.expiresAt;
      }

      let hashedPassword = paste.password;
      let isProtected = paste.isProtected;

      if (input.removePassword) {
        hashedPassword = null;
        isProtected = false;
      } else if (input.password) {
        hashedPassword = await hash(input.password, 10);
        isProtected = true;
      }

      await ctx.db
        .update(pastes)
        .set({
          title: input.title,
          content: input.content,
          language: input.language,
          expiresAt,
          isProtected,
          password: hashedPassword,
          visibility: input.visibility ?? paste.visibility,
          pasteType: input.pasteType ?? paste.pasteType,
        })
        .where(eq(pastes.id, input.id));

      return { success: true };
    }),
}); 