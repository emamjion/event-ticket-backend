import express from "express";

import {
  confirmPayment,
  createPayment,
} from "../controllers/paymentController.js";
import verifyToken from "../middleware/verifyToken.js";

const paymentRouter = express.Router();

paymentRouter.post("/create-payment", verifyToken, createPayment);
paymentRouter.post("/confirm-payment", verifyToken, confirmPayment);

export default paymentRouter;
