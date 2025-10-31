import mongoose from "mongoose";

const scanLogSchema = new mongoose.Schema(
  {
    ticketCode: {
      type: String,
      required: true,
    },
    moderatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    status: {
      type: String,
      enum: ["valid", "used", "invalid"],
      required: true,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const ScanLogModel =
  mongoose.models.ScanLog || mongoose.model("ScanLog", scanLogSchema);

export default ScanLogModel;
