import BannerModel from "../models/banner.model.js";

const getAllBanners = async (req, res) => {
  try {
    const banners = await BannerModel.find();
    res.json({
      success: true,
      message: "Banners fetched successfully!",
      banners: banners,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch banners" });
  }
};

export { getAllBanners };
