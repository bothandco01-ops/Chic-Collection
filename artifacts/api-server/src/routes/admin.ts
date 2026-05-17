import { Router } from "express";
import { eq, count, sum } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
}

router.get("/stats", requireAuth, async (req, res) => {
  try {
    const [{ value: totalOrders }] = await db.select({ value: count() }).from(ordersTable);
    const [{ value: pendingOrders }] = await db.select({ value: count() }).from(ordersTable).where(eq(ordersTable.status, "pending"));
    const [{ value: confirmedOrders }] = await db.select({ value: count() }).from(ordersTable).where(eq(ordersTable.status, "confirmed"));
    const [{ value: totalProducts }] = await db.select({ value: count() }).from(productsTable);
    const [{ value: totalRevenue }] = await db.select({ value: sum(ordersTable.totalAmount) }).from(ordersTable).where(eq(ordersTable.status, "confirmed"));

    const recentOrders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt).limit(10);
    const enrichedRecent = await Promise.all(
      recentOrders.map(async (order) => {
        const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
        const enrichedItems = await Promise.all(
          items.map(async (item) => {
            const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
            return { ...item, product: product || null };
          })
        );
        return { ...order, items: enrichedItems };
      })
    );

    res.json({
      totalOrders: Number(totalOrders) || 0,
      pendingOrders: Number(pendingOrders) || 0,
      confirmedOrders: Number(confirmedOrders) || 0,
      totalRevenue: Number(totalRevenue) || 0,
      totalProducts: Number(totalProducts) || 0,
      recentOrders: enrichedRecent,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/orders", requireAuth, async (req, res) => {
  try {
    let orders;
    if (req.query.status) {
      orders = await db.select().from(ordersTable).where(eq(ordersTable.status, req.query.status as string));
    } else {
      orders = await db.select().from(ordersTable);
    }
    const enriched = await Promise.all(
      orders.map(async (order) => {
        const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
        const enrichedItems = await Promise.all(
          items.map(async (item) => {
            const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
            return { ...item, product: product || null };
          })
        );
        return { ...order, items: enrichedItems };
      })
    );
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.patch("/orders/:id/status", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const [order] = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).returning();
    if (!order) return res.status(404).json({ error: "Order not found" });
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
        return { ...item, product: product || null };
      })
    );
    res.json({ ...order, items: enrichedItems });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

router.get("/products", requireAuth, async (req, res) => {
  try {
    const products = await db.select().from(productsTable);
    res.json(products);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

export default router;
