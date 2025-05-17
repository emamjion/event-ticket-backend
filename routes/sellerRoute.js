import express from "express";

import { getSellerEarnings } from "../controllers/earningsController.js";
import {
  deleteSellerProfile,
  getMySellerProfile,
  getSellerProfileById,
  updatePaymentInfo,
  updateSellerProfile,
} from "../controllers/sellerController.js";
import verifySeller from "../middleware/verifySeller.js";
import verifyToken from "../middleware/verifyToken.js";

const sellerRouter = express.Router();

// sellerRouter.post("/create-seller", verifyToken, createSellerProfile);
sellerRouter.patch(
  "/update-profile",
  verifyToken,
  verifySeller,
  updateSellerProfile
);
sellerRouter.get("/profile", verifyToken, getMySellerProfile);
sellerRouter.get("/profile/:userId", getSellerProfileById);

sellerRouter.delete("/:userId", verifyToken, verifySeller, deleteSellerProfile);
sellerRouter.get("/earnings", verifyToken, verifySeller, getSellerEarnings);
sellerRouter.put(
  "/update-payment-info",
  verifyToken,
  verifySeller,
  updatePaymentInfo
);

export default sellerRouter;
