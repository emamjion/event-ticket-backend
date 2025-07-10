import mongoose from "mongoose";

const seatSchema = new mongoose.Schema({
  section: String,
  row: String,
  seatNumber: Number,
  price: Number,
  isBooked: { type: Boolean },
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
  discountAmount: { type: Number, default: 0 },
  finalAmount: { type: Number },

  couponCode: { type: String, default: null },

  bookingTime: { type: Date, default: Date.now },
  paymentIntentId: { type: String },

  isPaid: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["success", "cancelled", "pending", "reserved", "refunded"],
    default: "pending",
  },
  sessionStartTime: {
    type: Date,
    default: null,
  },

  isUserVisible: {
    type: Boolean,
    default: false,
  },
  isTicketAvailable: {
    type: Boolean,
    default: true,
  },

  recipientEmail: {
    type: String,
    default: null,
  },
  note: {
    type: String,
    default: "",
  },
});

const BookingModel =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

export default BookingModel;
