import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, deliveryZonesTable } from "@workspace/db";

const router = Router();

router.get("/", async (req, res): Promise<void> => {
  try {
    const zones = await db
      .select()
      .from(deliveryZonesTable)
      .where(eq(deliveryZonesTable.isActive, true))
      .orderBy(deliveryZonesTable.state);
    res.json(zones);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch delivery zones" });
  }
});

export default router;
