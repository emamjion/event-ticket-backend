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
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    role: {
      type: String,
      enum: ["admin", "seller", "user", "buyer"],
      default: "buyer",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    purchasedTickets: [
      {
        ticketId: mongoose.Schema.Types.ObjectId,
        title: String,
        price: Number,
        seat: {
          name: String,
          section: String,
        },
        paymentInfo: {
          method: String,
          transactionId: String,
        },
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
