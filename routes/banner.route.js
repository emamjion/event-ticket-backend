import express from "express";
import { getAllBanners } from "../controllers/banner.controller.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const bannerRouter = express.Router();
bannerRouter.get("/banners", verifyToken, verifyAdmin, getAllBanners);
export default bannerRouter;
