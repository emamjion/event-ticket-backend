import express from "express";

import {
  cancelBooking,
  confirmPayment,
  createPayment,
  getCancelledOrders,
  refundAndCancel,
} from "../controllers/paymentController.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import verifySellerOrAdmin from "../middleware/verifySellerOrAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const paymentRouter = express.Router();

paymentRouter.post("/create-payment", verifyToken, createPayment);
paymentRouter.post("/confirm-payment", verifyToken, confirmPayment);
paymentRouter.post("/booking/cancel", verifyToken, cancelBooking);
paymentRouter.post("/refund", verifyToken, verifyAdmin, refundAndCancel);

// for seller and admin
paymentRouter.get(
  "/cancelled-bookings",
  verifyToken,
  verifySellerOrAdmin,
  getCancelledOrders
);

export default paymentRouter;
