import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, cartItemsTable, deliveryZonesTable, couponsTable, pageContentTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { getOrCreateSettings } from "./site-settings.js";
import { sendOrderNotification } from "../lib/email.js";

const router = Router();

export function formatInvoiceNumber(id: number, createdAt: Date | string): string {
  const year = new Date(createdAt).getFullYear();
  return `BC-${year}-${id.toString().padStart(5, "0")}`;
}

async function enrichOrder(order: typeof ordersTable.$inferSelect) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      return { ...item, product: product || null };
    })
  );
  return {
    ...order,
    invoiceNumber: formatInvoiceNumber(order.id, order.createdAt),
    items: enrichedItems,
  };
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
    const { guestEmail, guestName, totalAmount, shippingAddress, phone, notes, sessionId, items, deliveryState, couponCode } = req.body;
    const userId = auth?.userId || null;

    // Server-side delivery fee lookup
    let deliveryFee = 0;
    if (deliveryState) {
      const [zone] = await db
        .select()
        .from(deliveryZonesTable)
        .where(eq(deliveryZonesTable.state, deliveryState))
        .limit(1);
      if (zone) deliveryFee = zone.price;
    }

    // Server-side coupon validation and discount
    let discountAmount = 0;
    let appliedCouponCode: string | null = null;
    if (couponCode) {
      const [coupon] = await db
        .select()
        .from(couponsTable)
        .where(eq(couponsTable.code, String(couponCode).toUpperCase().trim()))
        .limit(1);
      if (
        coupon &&
        coupon.isActive &&
        (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date()) &&
        (coupon.maxUses === null || coupon.usedCount < coupon.maxUses)
      ) {
        const subtotal = (items || []).reduce(
          (sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity,
          0
        );
        if (coupon.minOrderAmount === null || subtotal >= coupon.minOrderAmount) {
          if (coupon.type === "percentage") {
            discountAmount = Math.floor((subtotal * coupon.value) / 100);
          } else {
            discountAmount = Math.min(coupon.value, subtotal);
          }
          appliedCouponCode = coupon.code;
          await db
            .update(couponsTable)
            .set({ usedCount: sql`${couponsTable.usedCount} + 1` })
            .where(eq(couponsTable.id, coupon.id));
        }
      }
    }

    const [order] = await db.insert(ordersTable).values({
      userId,
      guestEmail: guestEmail || null,
      guestName: guestName || null,
      status: "pending",
      totalAmount,
      deliveryFee,
      deliveryState: deliveryState || null,
      shippingAddress,
      phone,
      notes: appliedCouponCode
        ? `${notes ? notes + "\n" : ""}Coupon applied: ${appliedCouponCode} (-₦${discountAmount.toLocaleString()})`
        : notes || null,
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

    // Fire "order placed" notification email (non-blocking)
    const customerEmail = guestEmail;
    if (customerEmail) {
      void (async () => {
        try {
          const [templateRow] = await db.select().from(pageContentTable).where(eq(pageContentTable.slug, "notification-order-placed"));
          if (!templateRow) return;
          let tpl: { subject: string; body: string };
          try { tpl = JSON.parse(templateRow.body); } catch { return; }
          const settings = await getOrCreateSettings();
          const invoiceNo = formatInvoiceNumber(order.id, order.createdAt);
          const itemLines = enriched.items.map((i: { product?: { name?: string } | null; productId: number; quantity: number; price: number }) => `${i.product?.name || `Product #${i.productId}`} x${i.quantity} — ₦${(i.price * i.quantity).toLocaleString()}`).join("\n");
          await sendOrderNotification(settings, customerEmail, tpl.subject, tpl.body, {
            name: guestName || "Customer",
            orderNumber: invoiceNo,
            total: `₦${order.totalAmount.toLocaleString()}`,
            items: itemLines,
            address: shippingAddress || "",
            status: "pending",
          });
        } catch {
          // Non-critical — do not fail the order creation
        }
      })();
    }

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
