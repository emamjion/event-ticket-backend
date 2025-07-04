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
    contactNumber: {
      type: String,
    },
    address: {
      type: String,
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
    profileImg: {
      type: String,
      default:
        "https://res.cloudinary.com/demo/image/upload/v1700000000/default-avatar.png",
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
    verifyOtp: {
      type: String,
      default: "",
    },
    verifyOtpExpireAt: {
      type: Number,
      default: 0,
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
    resetOtp: {
      type: String,
      default: "",
    },
    resetOtpExpireAt: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
export default UserModel;
