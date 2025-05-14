import mongoose from "mongoose";

// Selected seat schema
const seatSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    number: Number,
    row: String,
    section: String,
    price: Number,
  },
  { _id: false }
);

// Ticket type schema
const ticketTypeSchema = new mongoose.Schema(
  {
    id: Number,
    name: String,
    price: String,
    contactOnly: Boolean,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ticket",
    required: true,
  },

  ticketType: ticketTypeSchema,

  selectedSeats: [seatSchema],

  quantity: { type: Number, required: true },

  totalPrice: { type: Number, required: true },

  grandTotal: { type: Number, required: true },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },

  stripePaymentId: String,

  purchaseDate: {
    type: Date,
    default: Date.now,
  },
});

const OrderModel =
  mongoose.models.Order || mongoose.model("Order", orderSchema);
export default OrderModel;
