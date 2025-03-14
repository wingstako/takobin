import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar,
  boolean,
  json,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `takobin_${name}`);

export const posts = createTable(
  "post",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: varchar("name", { length: 256 }),
    createdById: varchar("created_by", { length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (example) => ({
    createdByIdIdx: index("created_by_idx").on(example.createdById),
    nameIndex: index("name_idx").on(example.name),
  })
);

export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar("image", { length: 255 }),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  pastes: many(pastes),
  tags: many(tags),
}));

export const accounts = createTable(
  "account",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  })
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const pastes = createTable(
  "paste",
  {
    id: varchar("id", { length: 64 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    language: varchar("language", { length: 50 }).default("plaintext"),
    visibility: varchar("visibility", { length: 20 }).default("public").notNull(),
    pasteType: varchar("paste_type", { length: 20 }).default("text").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    isProtected: boolean("is_protected").default(false),
    password: varchar("password", { length: 255 }),
    userId: varchar("user_id", { length: 255 }).references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (paste) => ({
    userIdIdx: index("paste_user_id_idx").on(paste.userId),
    expiresAtIdx: index("paste_expires_at_idx").on(paste.expiresAt),
    pasteTypeIdx: index("paste_type_idx").on(paste.pasteType),
  })
);

export const fileUploads = createTable(
  "file_upload",
  {
    id: varchar("id", { length: 64 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pasteId: varchar("paste_id", { length: 64 })
      .notNull()
      .references(() => pastes.id, { onDelete: "cascade" }),
    filename: varchar("filename", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 50 }).notNull(),
    fileSize: integer("file_size").notNull(),
    storageKey: varchar("storage_key", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (fileUpload) => ({
    pasteIdIdx: index("file_upload_paste_id_idx").on(fileUpload.pasteId),
  })
);

export const tags = createTable(
  "tag",
  {
    id: varchar("id", { length: 64 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 50 }).notNull().unique(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (tag) => ({
    userIdIdx: index("tag_user_id_idx").on(tag.userId),
  })
);

export const pasteTags = createTable(
  "paste_tag",
  {
    pasteId: varchar("paste_id", { length: 64 })
      .notNull()
      .references(() => pastes.id, { onDelete: "cascade" }),
    tagId: varchar("tag_id", { length: 64 })
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (pasteTag) => ({
    pk: primaryKey({ columns: [pasteTag.pasteId, pasteTag.tagId] }),
    pasteIdIdx: index("paste_tag_paste_id_idx").on(pasteTag.pasteId),
    tagIdIdx: index("paste_tag_tag_id_idx").on(pasteTag.tagId),
  })
);

export const pastesRelations = relations(pastes, ({ one, many }) => ({
  user: one(users, { fields: [pastes.userId], references: [users.id] }),
  fileUploads: many(fileUploads),
  pasteTags: many(pasteTags),
}));

export const fileUploadsRelations = relations(fileUploads, ({ one }) => ({
  paste: one(pastes, { fields: [fileUploads.pasteId], references: [pastes.id] }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  pasteTags: many(pasteTags),
}));

export const pasteTagsRelations = relations(pasteTags, ({ one }) => ({
  paste: one(pastes, { fields: [pasteTags.pasteId], references: [pastes.id] }),
  tag: one(tags, { fields: [pasteTags.tagId], references: [tags.id] }),
}));
