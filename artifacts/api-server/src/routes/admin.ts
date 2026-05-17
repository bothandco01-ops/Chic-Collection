import { Router } from "express";
import { eq, count, sum, desc } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, siteSettingsTable, deliveryZonesTable } from "@workspace/db";
import { serialize } from "./products.js";
import { getOrCreateSettings } from "./site-settings";
import { getAuth, clerkClient } from "@clerk/express";

const router = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function getDbAdminEmails(): Promise<string[]> {
  try {
    const settings = await getOrCreateSettings();
    return (settings.adminEmails || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function isRequesterAdmin(req: any): Promise<boolean> {
  const auth = getAuth(req);
  if (!auth?.userId) return false;
  try {
    const user = await clerkClient.users.getUser(auth.userId);
    if (user.publicMetadata?.role === "admin") return true;
    const emails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase());
    const dbAdmins = await getDbAdminEmails();
    const allowed = new Set([...ADMIN_EMAILS, ...dbAdmins]);
    return emails.some((e) => allowed.has(e));
  } catch {
    return false;
  }
}

async function requireAdmin(req: any, res: any, next: any) {
  const auth = getAuth(req);
  if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });
  const ok = await isRequesterAdmin(req);
  if (ok) return next();
  return res.status(403).json({ error: "Forbidden" });
}

const requireAuth = requireAdmin;

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

router.patch("/orders/:id/status", requireAuth, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const [order] = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).returning();
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
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
    res.json(products.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/customers", requireAuth, async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    const map = new Map<string, { email: string; name: string | null; phone: string | null; totalOrders: number; totalSpent: number; lastOrderDate: string | null }>();
    for (const o of orders) {
      const key = (o.guestEmail || "").toLowerCase();
      if (!key) continue;
      const existing = map.get(key);
      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += Number(o.totalAmount) || 0;
      } else {
        map.set(key, {
          email: o.guestEmail || "",
          name: o.guestName || null,
          phone: o.phone || null,
          totalOrders: 1,
          totalSpent: Number(o.totalAmount) || 0,
          lastOrderDate: o.createdAt ? new Date(o.createdAt).toISOString() : null,
        });
      }
    }
    res.json(Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

router.patch("/site-settings", requireAuth, async (req, res): Promise<void> => {
  try {
    const current = await getOrCreateSettings();
    const updates: Record<string, unknown> = {};
    const scalarFields = [
      "bankName", "accountName", "accountNumber", "whatsappNumber",
      "heroTitle", "heroSubtitle", "heroImageUrl",
      "primaryColor", "backgroundColor", "cardColor", "foregroundColor", "accentColor", "mutedColor", "borderColor",
      "serifFont", "sansFont", "buttonRadius", "buttonStyle",
      "adminEmails",
    ];
    for (const key of scalarFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const jsonFields = ["heroBanners", "sectionsConfig", "featuredProductIds"];
    for (const key of jsonFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key] === null ? null : JSON.stringify(req.body[key]);
      }
    }
    const [updated] = await db.update(siteSettingsTable).set(updates).where(eq(siteSettingsTable.id, current.id)).returning();
    res.json(serializeSettings(updated, true));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// ---- Delivery Zones (admin CRUD) ----

router.get("/delivery-zones", requireAuth, async (req, res): Promise<void> => {
  try {
    const zones = await db.select().from(deliveryZonesTable).orderBy(deliveryZonesTable.state);
    res.json(zones);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch delivery zones" });
  }
});

router.post("/delivery-zones", requireAuth, async (req, res): Promise<void> => {
  try {
    const { state, price, isActive } = req.body;
    if (!state || price == null) { res.status(400).json({ error: "state and price are required" }); return; }
    const [zone] = await db.insert(deliveryZonesTable).values({
      state: String(state).trim(),
      price: Number(price),
      isActive: isActive !== false,
    }).returning();
    res.status(201).json(zone);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create delivery zone" });
  }
});

router.patch("/delivery-zones/:id", requireAuth, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const updates: Record<string, unknown> = {};
    if (req.body.state !== undefined) updates.state = String(req.body.state).trim();
    if (req.body.price !== undefined) updates.price = Number(req.body.price);
    if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
    const [zone] = await db.update(deliveryZonesTable).set(updates).where(eq(deliveryZonesTable.id, id)).returning();
    if (!zone) { res.status(404).json({ error: "Delivery zone not found" }); return; }
    res.json(zone);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update delivery zone" });
  }
});

router.delete("/delivery-zones/:id", requireAuth, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(deliveryZonesTable).where(eq(deliveryZonesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete delivery zone" });
  }
});

// ---- Settings ----

export function serializeSettings(row: any, includeAdminEmails: boolean) {
  const parse = <T>(v: unknown, fallback: T): T => {
    if (typeof v !== "string" || !v) return fallback;
    try { const p = JSON.parse(v); return p as T; } catch { return fallback; }
  };
  return {
    ...row,
    heroBanners: parse(row.heroBanners, [] as any[]),
    sectionsConfig: parse(row.sectionsConfig, {} as Record<string, boolean>),
    featuredProductIds: parse(row.featuredProductIds, [] as number[]),
    adminEmails: includeAdminEmails ? (row.adminEmails ?? "") : "",
  };
}

export default router;
