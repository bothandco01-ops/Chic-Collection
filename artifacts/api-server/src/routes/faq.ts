import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, faqEntriesTable } from "@workspace/db";
import { getAuth } from "@clerk/express";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const faqs = await db.select().from(faqEntriesTable).orderBy(faqEntriesTable.order);
    res.json(faqs);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch FAQ" });
  }
});

router.post("/", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });
    const { question, answer, order } = req.body;
    const [entry] = await db.insert(faqEntriesTable).values({ question, answer, order: order ?? 0 }).returning();
    res.status(201).json(entry);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create FAQ entry" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });
    const id = parseInt(req.params.id);
    const updates: Record<string, unknown> = {};
    if (req.body.question !== undefined) updates.question = req.body.question;
    if (req.body.answer !== undefined) updates.answer = req.body.answer;
    if (req.body.order !== undefined) updates.order = req.body.order;
    const [entry] = await db.update(faqEntriesTable).set(updates).where(eq(faqEntriesTable.id, id)).returning();
    if (!entry) return res.status(404).json({ error: "FAQ entry not found" });
    res.json(entry);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update FAQ entry" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });
    const id = parseInt(req.params.id);
    await db.delete(faqEntriesTable).where(eq(faqEntriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete FAQ entry" });
  }
});

export default router;
