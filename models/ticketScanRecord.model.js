import mongoose from "mongoose";

const ticketScanRecordSchema = new mongoose.Schema({
  ticketCode: String,
  scannedAt: { type: Date, default: Date.now },
  moderatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: {
    type: String,
    enum: ["valid", "used", "invalid"],
    required: true,
  },
});

export const TicketScanRecord =
  mongoose.models.TicketScanRecord ||
  mongoose.model("TicketScanRecord", ticketScanRecordSchema);
