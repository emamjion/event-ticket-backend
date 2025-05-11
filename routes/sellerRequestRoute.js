import express from "express";
import { submitSellerRequest } from "../controllers/sellerRequestController.js";

const sellerRequestRouter = express.Router();

// Public route (no token)
sellerRequestRouter.post("/request", submitSellerRequest);

export default sellerRequestRouter;
