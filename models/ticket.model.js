import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },

  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },

  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  pdfUrl: {
    type: String,
    required: true,
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  scannedAt: {
    type: Date,
    default: null,
  },

  scanStatus: {
    type: String,
    enum: ["not_scanned", "valid", "used", "invalid"],
    default: "not_scanned",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const TicketModel =
  mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
export default TicketModel;
