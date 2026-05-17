import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  bankName: text("bank_name").notNull().default("First Bank Nigeria"),
  accountName: text("account_name").notNull().default("BOTH & CO. LIMITED"),
  accountNumber: text("account_number").notNull().default("3012345678"),
  whatsappNumber: text("whatsapp_number").notNull().default("2348001234567"),
  heroTitle: text("hero_title").notNull().default("Elevated. Sensual. Unapologetic."),
  heroSubtitle: text("hero_subtitle").notNull().default("Luxury Nigerian womenswear accessories crafted for the stylish, confident woman."),
  heroImageUrl: text("hero_image_url"),
  adminEmails: text("admin_emails").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettingsTable).omit({ id: true, updatedAt: true });
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettingsTable.$inferSelect;
