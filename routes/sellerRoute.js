import express from "express";
import { getSellerEarnings } from "../controllers/earningsController.js";
import {
  deleteSellerProfile,
  getMySellerProfile,
  getSellerProfileById,
  updateSellerProfile,
} from "../controllers/sellerController.js";
import verifySeller from "../middleware/verifySeller.js";
import verifyToken from "../middleware/verifyToken.js";

const sellerRouter = express.Router();

// sellerRouter.post("/create-seller", verifyToken, createSellerProfile);
sellerRouter.patch("/update-profile", verifyToken, updateSellerProfile);
sellerRouter.get("/profile", verifyToken, getMySellerProfile);
sellerRouter.get("/profile/:userId", getSellerProfileById);

sellerRouter.delete("/:userId", verifyToken, deleteSellerProfile);
sellerRouter.get(
  "/earnings/:sellerId",
  verifyToken,
  verifySeller,
  getSellerEarnings
);

export default sellerRouter;
