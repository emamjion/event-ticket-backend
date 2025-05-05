import express from "express";
import {
  getPublishedTicketById,
  getPublishedTickets,
} from "../controllers/publishTicketController.js";
import { guestPurchaseTicket } from "../controllers/purchaseTicketController.js";
import {
  // buyTicket,
  createTicket,
  deleteTicket,
  getTicketById,
  getTickets,
  // purchaseTicket,
  updateTicket,
} from "../controllers/ticketController.js";
import upload from "../middleware/multer.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const ticketRouter = express.Router();

// All Tickets
ticketRouter.get("/tickets", getTickets);
// Create New Ticket
ticketRouter.post(
  "/create-ticket",
  upload.single("image"),
  verifyToken,
  verifyAdmin,
  createTicket
);
// Get Ticket Details
ticketRouter.get("/tickets/:id", getTicketById);
// Update Ticket
ticketRouter.patch("/tickets/:id", verifyToken, verifyAdmin, updateTicket);
// Delete Ticket
ticketRouter.delete("/tickets/:id", verifyToken, verifyAdmin, deleteTicket);

// Purchase ticket routes
// ticketRouter.post("/purchase-ticket", verifyToken, purchaseTicket);
// ticketRouter.post("/buy-ticket", verifyToken, buyTicket);

// guest purchase ticket route
ticketRouter.post("/guest-purchase", guestPurchaseTicket);
// public ticket route
ticketRouter.get("/published-tickets", getPublishedTickets);
// published ticket details route
ticketRouter.get("/published-ticket/:id", getPublishedTicketById);
export default ticketRouter;
