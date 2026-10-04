import { Router, type IRouter } from "express";
import authRouter from "./auth";
import siteContentRouter from "./site-content";
import storageRouter from "./storage";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(siteContentRouter);
router.use(storageRouter);

export default router;
