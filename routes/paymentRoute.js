import express from "express";
import {
  confirmPayment,
  createTicketPayment,
} from "../controllers/paymentController.js";
import verifyToken from "../middleware/verifyToken.js";

const paymentRouter = express.Router();

paymentRouter.post("/create-ticket-payment", verifyToken, createTicketPayment);
paymentRouter.post("/confirm-payment", verifyToken, confirmPayment);

export default paymentRouter;
