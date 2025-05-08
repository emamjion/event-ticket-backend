import express from "express";
import { getMyOrders, getSingleOrder } from "../controllers/orderController.js";
import verifyToken from "../middleware/verifyToken.js";

const orderRouter = express.Router();

orderRouter.get("/my-orders", verifyToken, getMyOrders);
orderRouter.get("/my-orders/:id", verifyToken, getSingleOrder);

export default orderRouter;
