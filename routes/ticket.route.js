import express from "express";
import {
  sendOrderEmail,
  uploadTicket,
  verifyTicket,
} from "../controllers/ticket.controller.js";
import upload from "../middleware/multer.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const ticketRouter = express.Router();
ticketRouter.post("/verify-ticket", verifyToken, verifyAdmin, verifyTicket);
ticketRouter.post("/send-order-email", verifyToken, sendOrderEmail);
// ticketRouter.post("/send-order-email", verifyToken, sendEmailToBuyer);
ticketRouter.post(
  "/upload",
  upload.array("pdfFiles"),
  verifyToken,
  uploadTicket
);

export default ticketRouter;
