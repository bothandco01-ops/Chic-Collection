import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, pageContentTable } from "@workspace/db";

const router = Router();

router.get("/:slug", async (req, res): Promise<void> => {
  try {
    const [page] = await db.select().from(pageContentTable).where(eq(pageContentTable.slug, req.params.slug));
    if (!page) { res.status(404).json({ error: "Page not found" }); return; }
    res.json(page);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch page" });
  }
});

export default router;
