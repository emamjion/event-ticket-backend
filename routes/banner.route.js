import express from "express";
import {
  deleteBanner,
  getAllBanners,
  updateBanner,
  uploadBanners,
} from "../controllers/banner.controller.js";
import upload from "../middleware/multer.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const bannerRouter = express.Router();
bannerRouter.get("/banners", verifyToken, verifyAdmin, getAllBanners);
bannerRouter.post(
  "/upload",
  upload.array("images"),
  verifyToken,
  verifyAdmin,
  uploadBanners
);
bannerRouter.put(
  "/update/:id",
  upload.single("image"),
  verifyToken,
  verifyAdmin,
  updateBanner
);

bannerRouter.delete("/delete/:id", verifyToken, verifyAdmin, deleteBanner);
export default bannerRouter;
