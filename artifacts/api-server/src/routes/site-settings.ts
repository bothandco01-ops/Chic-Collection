import { Router } from "express";
import { db, siteSettingsTable } from "@workspace/db";
import { isRequesterAdmin } from "./admin.js";

const router = Router();

export async function getOrCreateSettings() {
  const existing = await db.select().from(siteSettingsTable).limit(1);
  if (existing.length > 0) return existing[0];
  const [created] = await db.insert(siteSettingsTable).values({}).returning();
  return created;
}

router.get("/", async (req, res): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    // Only expose adminEmails to admins; strip from public responses.
    const isAdmin = await isRequesterAdmin(req);
    res.json({ ...settings, adminEmails: isAdmin ? (settings.adminEmails ?? "") : "" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

export default router;
