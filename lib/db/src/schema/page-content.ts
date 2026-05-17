import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pageContentTable = pgTable("page_content", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPageContentSchema = createInsertSchema(pageContentTable).omit({ updatedAt: true });
export type InsertPageContent = z.infer<typeof insertPageContentSchema>;
export type PageContent = typeof pageContentTable.$inferSelect;
