import mongoose from "mongoose";

// Seat Schema
const seatSchema = new mongoose.Schema({
  section: String,
  row: String,
  seatNumber: Number,
  price: Number,
});

// Ticket Type Schema (assumed structure)
const ticketTypeSchema = new mongoose.Schema({
  type: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

// Main Event Schema
const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: String, required: true },

    isPublished: { type: Boolean, default: false },

    // Tickets and Seats Info
    ticketsAvailable: { type: Number, required: true },
    ticketSold: { type: Number, default: 0 },

    ticketTypes: [ticketTypeSchema],
    seats: [seatSchema],

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

// Model Export
const EventModel =
  mongoose.models.Event || mongoose.model("Event", eventSchema);

export default EventModel;
