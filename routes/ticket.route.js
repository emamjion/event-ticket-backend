import express from "express";
import {
  sendOrderEmail,
  verifyTicket,
} from "../controllers/ticket.controller.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const ticketRouter = express.Router();
ticketRouter.post("/verify-ticket", verifyToken, verifyAdmin, verifyTicket);
ticketRouter.post("/send-order-email", verifyToken, sendOrderEmail);

export default ticketRouter;
