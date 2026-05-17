import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { isRequesterAdmin } from "./admin.js";

const router = Router();

type ProductRow = typeof productsTable.$inferSelect;
export function serialize(p: ProductRow) {
  let imageUrls: string[] = [];
  if (p.imageUrls) {
    try { const parsed = JSON.parse(p.imageUrls); if (Array.isArray(parsed)) imageUrls = parsed.filter((x) => typeof x === "string"); } catch { /* ignore */ }
  }
  const { imageUrls: _omit, ...rest } = p;
  return { ...rest, imageUrls };
}

router.get("/", async (req, res) => {
  try {
    let query = db.select().from(productsTable);
    const conditions = [];
    if (req.query.category) {
      conditions.push(eq(productsTable.category, req.query.category as string));
    }
    if (req.query.featured === "true") {
      conditions.push(eq(productsTable.featured, true));
    }
    const products = conditions.length > 0
      ? await db.select().from(productsTable).where(and(...conditions))
      : await query;
    res.json(products.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }
    res.json(serialize(product));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.post("/", async (req, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    if (!(await isRequesterAdmin(req))) { res.status(403).json({ error: "Forbidden" }); return; }
    const { name, description, price, category, imageUrl, imageUrls, inStock, featured, sizes } = req.body;
    const [product] = await db.insert(productsTable).values({
      name, description, price, category, imageUrl,
      imageUrls: Array.isArray(imageUrls) ? JSON.stringify(imageUrls) : null,
      inStock: inStock ?? true,
      featured: featured ?? false,
      sizes,
    }).returning();
    res.status(201).json(serialize(product));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.patch("/:id", async (req, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    if (!(await isRequesterAdmin(req))) { res.status(403).json({ error: "Forbidden" }); return; }
    const id = parseInt(req.params.id);
    const updates: Record<string, unknown> = {};
    const allowed = ["name", "description", "price", "category", "imageUrl", "inStock", "featured", "sizes"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (req.body.imageUrls !== undefined) {
      updates.imageUrls = Array.isArray(req.body.imageUrls) ? JSON.stringify(req.body.imageUrls) : null;
    }
    const [product] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }
    res.json(serialize(product));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/:id", async (req, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    if (!(await isRequesterAdmin(req))) { res.status(403).json({ error: "Forbidden" }); return; }
    const id = parseInt(req.params.id);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
