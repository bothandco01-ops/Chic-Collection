import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, cartItemsTable, productsTable } from "@workspace/db";

const router = Router();

async function getCartWithProducts(sessionId: string) {
  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));
  const enriched = await Promise.all(
    items.map(async (item) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      return { ...item, product: product || null };
    })
  );
  return enriched;
}

router.get("/", async (req, res): Promise<void> => {
  try {
    const sessionId = req.headers["x-session-id"] as string || req.query.sessionId as string;
    if (!sessionId) { res.json([]); return; }
    const items = await getCartWithProducts(sessionId);
    res.json(items);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

router.post("/", async (req, res): Promise<void> => {
  try {
    const { productId, quantity, size, sessionId } = req.body;
    if (!sessionId) { res.status(400).json({ error: "sessionId required" }); return; }

    const existing = await db.select().from(cartItemsTable).where(
      and(eq(cartItemsTable.sessionId, sessionId), eq(cartItemsTable.productId, productId))
    );

    if (existing.length > 0) {
      const [updated] = await db.update(cartItemsTable)
        .set({ quantity: existing[0].quantity + (quantity || 1) })
        .where(eq(cartItemsTable.id, existing[0].id))
        .returning();
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
      res.status(201).json({ ...updated, product: product || null });
      return;
    }

    const [item] = await db.insert(cartItemsTable).values({
      sessionId, productId, quantity: quantity || 1, size,
    }).returning();
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
    res.status(201).json({ ...item, product: product || null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

router.patch("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { quantity } = req.body;
    const [item] = await db.update(cartItemsTable).set({ quantity }).where(eq(cartItemsTable.id, id)).returning();
    if (!item) { res.status(404).json({ error: "Cart item not found" }); return; }
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    res.json({ ...item, product: product || null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update cart item" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const sessionId = req.headers["x-session-id"] as string || req.query.sessionId as string;
    if (sessionId) {
      await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));
    }
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(cartItemsTable).where(eq(cartItemsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to remove cart item" });
  }
});

export default router;
