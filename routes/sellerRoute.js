import express from "express";

import {
  deleteSellerProfile,
  getMySellerProfile,
  getSellerProfileById,
  updateSellerProfile,
} from "../controllers/sellerController.js";
import verifySeller from "../middleware/verifySeller.js";
import verifyToken from "../middleware/verifyToken.js";
import { getSellerEarnings } from "../controllers/earningsController.js";

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

export default sellerRouter;
