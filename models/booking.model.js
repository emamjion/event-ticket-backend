import mongoose from "mongoose";

const seatSchema = new mongoose.Schema({
  section: String,
  row: String,
  seatNumber: Number,
  price: Number,
  isBooked: { type: Boolean, default: false },
});

const bookingSchema = new mongoose.Schema({
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
  seats: { type: [seatSchema], required: true },
  totalAmount: { type: Number, required: true },
  bookingTime: { type: Date, default: Date.now },
  paymentIntentId: String,

  isPaid: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["success", "cancelled", "pending", "reserved"],
    default: "pending",
  },
  isTicketAvailable: {
    type: Boolean,
    default: true,
  },
});

const BookingModel =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

export default BookingModel;
