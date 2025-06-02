import express from "express";
import {
  getMyOrders,
  //   getMyReservations,
  getSingleOrder,
} from "../controllers/orderController.js";
import verifyToken from "../middleware/verifyToken.js";

const orderRouter = express.Router();

orderRouter.get("/my-orders", verifyToken, getMyOrders);
orderRouter.get("/my-orders/:id", verifyToken, getSingleOrder);
// orderRouter.get(
//   "/my-reservations",
//   verifyToken,
//   verifySellerOrAdmin,
//   getMyReservations
// );

export default orderRouter;
