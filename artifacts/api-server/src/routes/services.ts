import { Router } from "express";
import { db, servicesTable } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const services = await db.select().from(servicesTable);
    res.json(services);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

export default router;
