import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "seller", "user", "buyer"],
      default: "user",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    purchasedTickets: [
      {
        ticketId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Ticket",
        },
        name: String,
        price: Number,
        date: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
export default UserModel;
