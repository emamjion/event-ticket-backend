import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    shopName: {
      type: String,
      trim: true,
      required: false,
    },
    email: {
      type: String,
      trim: true,
      required: true,
    },
    bio: {
      type: String,
      trim: true,
      required: false,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      trim: true,
      required: false,
    },
    website: {
      type: String,
      trim: true,
      required: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    paymentInfo: {
      method: { type: String }, // e.g., 'bKash', 'Nagad', 'Bank', 'Stripe'
      accountNumber: { type: String },
      accountName: { type: String },
      status: {
        type: String,
        enum: ["pending", "verified"],
        default: "pending", // admin verify korbe
      },
    },
  },
  {
    timestamps: true,
  }
);

const SellerModel =
  mongoose.models.Seller || mongoose.model("Seller", sellerSchema);

export default SellerModel;
