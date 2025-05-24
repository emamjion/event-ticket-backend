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
  isPaid: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "reserved", "cancelled"],
    default: "pending",
  },
  role: {
    type: String,
    enum: ["buyer", "seller"],
    default: "buyer",
  },
  // code: {
  //   type: String,
  //   default: null,
  // },
  seats: { type: [seatSchema], required: true },
  totalAmount: { type: Number, required: true },
  bookingTime: { type: Date, default: Date.now },
  paymentIntentId: String,
});

const BookingModel =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
export default BookingModel;
