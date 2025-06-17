import mongoose from "mongoose";

const seatSchema = new mongoose.Schema({
  section: String,
  row: String,
  seatNumber: Number,
  price: Number,
  status: {
    type: String,
    enum: ["available", "reserved", "sold"],
    default: "available",
  },
});

const ticketTypeSchema = new mongoose.Schema({
  type: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },

    contactNumber: {
      type: String,
      match: [/^\d{10,15}$/, "Please enter a valid contact number"],
    },
    email: {
      type: String,
      match: [/.+\@.+\..+/, "Please enter a valid email address"],
    },

    isPublished: { type: Boolean, default: false },
    // ticketsAvailable: { type: Number, required: true },
    ticketSold: { type: Number, default: 0 },

    ticketTypes: [ticketTypeSchema],
    seats: [seatSchema],
    soldTickets: [seatSchema],
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const EventModel =
  mongoose.models.Event || mongoose.model("Event", eventSchema);

export default EventModel;
