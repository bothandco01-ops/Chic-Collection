import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, couponsTable } from "@workspace/db";

const router = Router();

router.post("/validate", async (req, res): Promise<void> => {
  try {
    const { code, orderAmount } = req.body;
    if (!code || orderAmount === undefined) {
      res.status(400).json({ error: "code and orderAmount are required" });
      return;
    }

    const [coupon] = await db
      .select()
      .from(couponsTable)
      .where(eq(couponsTable.code, String(code).toUpperCase().trim()))
      .limit(1);

    if (!coupon) {
      res.status(400).json({ error: "Invalid coupon code" });
      return;
    }
    if (!coupon.isActive) {
      res.status(400).json({ error: "This coupon is no longer active" });
      return;
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      res.status(400).json({ error: "This coupon has expired" });
      return;
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      res.status(400).json({ error: "This coupon has reached its usage limit" });
      return;
    }
    if (coupon.minOrderAmount !== null && orderAmount < coupon.minOrderAmount) {
      res.status(400).json({
        error: `Minimum order of ₦${coupon.minOrderAmount.toLocaleString()} required for this coupon`,
      });
      return;
    }

    let discountAmount: number;
    if (coupon.type === "percentage") {
      discountAmount = Math.floor((orderAmount * coupon.value) / 100);
    } else {
      discountAmount = Math.min(coupon.value, orderAmount);
    }

    res.json({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to validate coupon" });
  }
});

export default router;
