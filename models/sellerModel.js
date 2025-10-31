import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },
    organizationName: {
      type: String,
      required: true,
      trim: true,
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
    profileImg: {
      type: String,
      default:
        "https://res.cloudinary.com/demo/image/upload/v1700000000/default-avatar.png",
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
