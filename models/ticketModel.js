// import mongoose from "mongoose";

// const ticketSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//     },
//     description: {
//       type: String,
//       required: true,
//     },
//     time: {
//       type: String,
//       required: true,
//     },
//     location: {
//       type: String,
//       required: true,
//     },
//     image: {
//       type: String,
//       required: true,
//     },
//     price: {
//       type: String,
//       required: true,
//     },
//     isPublished: {
//       type: Boolean,
//       default: false,
//     },
//     ticketsAvailable: {
//       type: Number,
//       required: true,
//     },
//     ticketSold: {
//       type: Number,
//       default: 0,
//     },

//     sellerId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Seller",
//       required: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// const TicketModel =
//   mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
// export default TicketModel;

import mongoose from "mongoose";

// Define ticket type schema
const ticketTypeSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    contactOnly: { type: Boolean, default: false },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: String, required: true }, // Base price
    isPublished: { type: Boolean, default: false },
    ticketsAvailable: { type: Number, required: true },
    ticketSold: { type: Number, default: 0 },

    // Array of ticket types
    ticketTypes: [ticketTypeSchema],

    // Seller reference
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

// Exporting
const TicketModel =
  mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
export default TicketModel;
