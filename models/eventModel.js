import mongoose from "mongoose";

const ticketTypeSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    contactOnly: { type: Boolean, default: false },
  },
  { _id: false }
);

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
    ticketsAvailable: { type: Number, required: true },
    ticketSold: { type: Number, default: 0 },

    ticketTypes: [ticketTypeSchema],

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
