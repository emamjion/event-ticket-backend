import express from "express";
import {
  createTicket,
  deleteTicket,
  getTicketById,
  getTickets,
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

export default ticketRouter;
