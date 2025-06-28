import express from "express";
import { verifyTicket } from "../controllers/ticket.controller.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const ticketRouter = express.Router();
ticketRouter.post("/verify/:orderId", verifyToken, verifyAdmin, verifyTicket);

export default ticketRouter;
