import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import { getAuth, clerkClient } from "@clerk/express";

const router = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const user = await clerkClient.users.getUser(userId);
    if (user.publicMetadata?.role === "admin") return true;
    const emails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase());
    return emails.some((e) => ADMIN_EMAILS.includes(e));
  } catch {
    return false;
  }
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
    res.json(products);
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
    res.json(product);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.post("/", async (req, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    if (!(await isAdminUser(auth.userId))) { res.status(403).json({ error: "Forbidden" }); return; }
    const { name, description, price, category, imageUrl, inStock, featured, sizes } = req.body;
    const [product] = await db.insert(productsTable).values({
      name, description, price, category, imageUrl,
      inStock: inStock ?? true,
      featured: featured ?? false,
      sizes,
    }).returning();
    res.status(201).json(product);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.patch("/:id", async (req, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    if (!(await isAdminUser(auth.userId))) { res.status(403).json({ error: "Forbidden" }); return; }
    const id = parseInt(req.params.id);
    const updates: Record<string, unknown> = {};
    const allowed = ["name", "description", "price", "category", "imageUrl", "inStock", "featured", "sizes"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const [product] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }
    res.json(product);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/:id", async (req, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    if (!(await isAdminUser(auth.userId))) { res.status(403).json({ error: "Forbidden" }); return; }
    const id = parseInt(req.params.id);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
