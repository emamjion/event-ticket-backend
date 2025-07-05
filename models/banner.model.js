import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    size: { type: String, default: "" }, // Optional image size like '1200x600'
  },
  { timestamps: true }
);

const BannerModel =
  mongoose.models.Banner || mongoose.model("Banner", bannerSchema);

export default BannerModel;
