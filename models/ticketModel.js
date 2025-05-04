import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    ticketsAvailable: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TicketModel =
  mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
export default TicketModel;
