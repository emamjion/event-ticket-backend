import express from "express";
import { createSellerProfile } from "../controllers/sellerController.js";
import verifyToken from "../middleware/verifyToken.js";

const sellerRouter = express.Router();

sellerRouter.post("/create-seller", verifyToken, createSellerProfile);
// sellerRouter.patch("/update-profile", verifyToken, updateSellerProfile);
// sellerRouter.get("/profile", verifyToken, getMySellerProfile);
// sellerRouter.get("/profile/:userId", getSellerProfileById);

// sellerRouter.delete("/:userId", verifyToken, deleteSellerProfile);

export default sellerRouter;
