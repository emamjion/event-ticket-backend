import express from "express";

import {
  cancelBooking,
  confirmPayment,
  createPayment,
  getCancelledOrders,
  refundBooking,
} from "../controllers/paymentController.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import verifySellerOrAdmin from "../middleware/verifySellerOrAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const paymentRouter = express.Router();

paymentRouter.post("/create-payment", verifyToken, createPayment);
paymentRouter.post("/confirm-payment", verifyToken, confirmPayment);
paymentRouter.post("/booking/cancel", verifyToken, cancelBooking);
paymentRouter.post("/refund/:orderId", verifyToken, verifyAdmin, refundBooking);
paymentRouter.get(
  "/cancelled-bookings",
  verifyToken,
  verifySellerOrAdmin,
  getCancelledOrders
);

export default paymentRouter;
