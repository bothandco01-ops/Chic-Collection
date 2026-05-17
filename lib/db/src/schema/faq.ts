import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const faqEntriesTable = pgTable("faq_entries", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  order: integer("order").notNull().default(0),
});

export const insertFaqEntrySchema = createInsertSchema(faqEntriesTable).omit({ id: true });
export type InsertFaqEntry = z.infer<typeof insertFaqEntrySchema>;
export type FaqEntry = typeof faqEntriesTable.$inferSelect;
