import mongoose from "mongoose";

const seatSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    section: {
      type: String,
      default: "General",
    },
    row: {
      type: String,
      required: true,
    },
    seatNumber: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "locked", "booked"],
      default: "available",
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const SeatModel = mongoose.models.Seat || mongoose.model("Seat", seatSchema);

export default SeatModel;
