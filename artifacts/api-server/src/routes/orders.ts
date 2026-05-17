import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, cartItemsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";

const router = Router();

async function enrichOrder(order: typeof ordersTable.$inferSelect) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      return { ...item, product: product || null };
    })
  );
  return { ...order, items: enrichedItems };
}

router.get("/", async (req, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, auth.userId));
    const enriched = await Promise.all(orders.map(enrichOrder));
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.post("/", async (req, res) => {
  try {
    const auth = getAuth(req);
    const { guestEmail, guestName, totalAmount, shippingAddress, phone, notes, sessionId, items } = req.body;
    const userId = auth?.userId || null;

    const [order] = await db.insert(ordersTable).values({
      userId,
      guestEmail: guestEmail || null,
      guestName: guestName || null,
      status: "pending",
      totalAmount,
      shippingAddress,
      phone,
      notes: notes || null,
    }).returning();

    if (items && items.length > 0) {
      for (const item of items) {
        await db.insert(orderItemsTable).values({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          size: item.size || null,
        });
      }
    }

    if (sessionId) {
      await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));
    }

    const enriched = await enrichOrder(order);
    res.status(201).json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.get("/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    const enriched = await enrichOrder(order);
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.post("/:id/payment-proof", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { paymentProofUrl } = req.body;
    const [order] = await db.update(ordersTable)
      .set({ paymentProofUrl, status: "payment_uploaded" })
      .where(eq(ordersTable.id, id))
      .returning();
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    const enriched = await enrichOrder(order);
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to submit payment proof" });
  }
});

export default router;
