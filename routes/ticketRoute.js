import express from "express";
import {
  createTicket,
  deleteTicket,
  getTicketById,
  getTickets,
  updateTicket,
} from "../controllers/ticketController.js";

const ticketRouter = express.Router();

// All Tickets
ticketRouter.get("/tickets", getTickets);
// Create New Ticket
ticketRouter.post("/create-ticket", createTicket);
// Get Ticket Details
ticketRouter.get("/tickets/:id", getTicketById);
// Update Ticket
ticketRouter.patch("/tickets/:id", updateTicket);
// Delete Ticket
ticketRouter.delete("/tickets/:id", deleteTicket);

export default ticketRouter;
