import { integer, pgTable, varchar, text, vector, jsonb } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  credits: integer().default(2),
});

export const documentsTable = pgTable("documents", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  fileName: varchar({ length: 255 }).notNull(),
  mimeType: varchar({ length: 100 }),
  extractedText: text().notNull(),
  createdAt: varchar({ length: 100 }).notNull(),
});

export const documentChunksTable = pgTable("document_chunks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  documentId: integer().notNull().references(() => documentsTable.id, { onDelete: 'cascade' }),
  chunkText: text().notNull(),
  chunkIndex: integer().notNull(),
  embedding: vector({ dimensions: 384 }), // all-MiniLM-L6-v2 produces 384-dimensional embeddings
  metadata: jsonb("metadata").$type<{ pageNumber?: number; chapterTitle?: string; sectionTitle?: string }>().default({}),
});
