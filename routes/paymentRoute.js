import express from "express";

import {
  cancelBooking,
  confirmPayment,
  createPayment,
  getCancelledOrders,
} from "../controllers/paymentController.js";
import verifySellerOrAdmin from "../middleware/verifySellerOrAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const paymentRouter = express.Router();

paymentRouter.post("/create-payment", verifyToken, createPayment);
paymentRouter.post("/confirm-payment", verifyToken, confirmPayment);
paymentRouter.post("/booking/cancel", verifyToken, cancelBooking);
paymentRouter.get(
  "/cancelled-bookings",
  verifyToken,
  verifySellerOrAdmin,
  getCancelledOrders
);

export default paymentRouter;
