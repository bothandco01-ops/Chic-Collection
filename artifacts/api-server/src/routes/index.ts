import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import faqRouter from "./faq";
import servicesRouter from "./services";
import adminRouter from "./admin";
import siteSettingsRouter from "./site-settings";
import deliveryZonesRouter from "./delivery-zones";
import pagesRouter from "./pages";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/products", productsRouter);
router.use("/cart", cartRouter);
router.use("/orders", ordersRouter);
router.use("/faq", faqRouter);
router.use("/services", servicesRouter);
router.use("/admin", adminRouter);
router.use("/site-settings", siteSettingsRouter);
router.use("/delivery-zones", deliveryZonesRouter);
router.use("/pages", pagesRouter);

export default router;
