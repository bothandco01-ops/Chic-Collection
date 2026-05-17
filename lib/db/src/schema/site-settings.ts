import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),

  // Bank transfer
  bankName: text("bank_name").notNull().default("First Bank Nigeria"),
  accountName: text("account_name").notNull().default("BOTH & CO. LIMITED"),
  accountNumber: text("account_number").notNull().default("3012345678"),

  // Contact
  whatsappNumber: text("whatsapp_number").notNull().default("2348001234567"),

  // Legacy single hero (still editable; first banner of carousel falls back to these)
  heroTitle: text("hero_title").notNull().default("Elevated. Sensual. Unapologetic."),
  heroSubtitle: text("hero_subtitle").notNull().default("Luxury Nigerian womenswear accessories crafted for the stylish, confident woman."),
  heroImageUrl: text("hero_image_url"),

  // Carousel of hero banners (JSON array of HeroBanner)
  heroBanners: text("hero_banners"),

  // Section toggles (JSON object)
  sectionsConfig: text("sections_config"),

  // Featured product order (JSON array of integers)
  featuredProductIds: text("featured_product_ids"),

  // Theme colors (hex)
  primaryColor: text("primary_color").notNull().default("#c45580"),
  backgroundColor: text("background_color").notNull().default("#110e0e"),
  cardColor: text("card_color").notNull().default("#1a1716"),
  foregroundColor: text("foreground_color").notNull().default("#f5ece4"),
  accentColor: text("accent_color").notNull().default("#d490a9"),
  mutedColor: text("muted_color").notNull().default("#2a2422"),
  borderColor: text("border_color").notNull().default("#4a2a3a"),

  // Fonts (Google Font family names)
  serifFont: text("serif_font").notNull().default("Playfair Display"),
  sansFont: text("sans_font").notNull().default("Inter"),

  // Button style: radius (0 = sharp, 6 = rounded, 999 = pill); style: solid|outline
  buttonRadius: text("button_radius").notNull().default("0"),
  buttonStyle: text("button_style").notNull().default("solid"),

  // Admin allowlist
  adminEmails: text("admin_emails").notNull().default(""),

  // Email / SMTP
  smtpEnabled: boolean("smtp_enabled").notNull().default(false),
  smtpHost: text("smtp_host").notNull().default(""),
  smtpPort: text("smtp_port").notNull().default("587"),
  smtpUser: text("smtp_user").notNull().default(""),
  smtpFrom: text("smtp_from").notNull().default(""),
  // Where to send admin order alerts (owner's inbox)
  notificationEmail: text("notification_email").notNull().default(""),

  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettingsTable).omit({ id: true, updatedAt: true });
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettingsTable.$inferSelect;
