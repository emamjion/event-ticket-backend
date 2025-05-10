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
  },
  {
    timestamps: true,
  }
);

const SellerModel =
  mongoose.models.Seller || mongoose.model("Seller", sellerSchema);

export default SellerModel;
