import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  seats: {
    type: [
      {
        section: String,
        row: String,
        seatNumber: Number,
        price: Number,
      },
    ],
    required: true,
  },
  totalAmount: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },
  paymentIntentId: String,
  orderTime: {
    type: Date,
    default: Date.now,
  },
});

const OrderModel =
  mongoose.models.Order || mongoose.model("Order", orderSchema);
export default OrderModel;
