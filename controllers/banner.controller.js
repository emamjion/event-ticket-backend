import { v2 as cloudinary } from "cloudinary";
import BannerModel from "../models/banner.model.js";

const getAllBanners = async (req, res) => {
  try {
    const banners = await BannerModel.find();
    res.json({
      success: true,
      message: "Banner images fetched successfully!",
      totalImages: banners.length,
      banners: banners,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch banners" });
  }
};

const uploadBanners = async (req, res) => {
  try {
    let sizes = req.body.sizes || [];
    const files = req.files;

    if (typeof sizes === "string") {
      sizes = [sizes];
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No banner images provided",
      });
    }

    if (files.length > 5) {
      return res.status(400).json({
        success: false,
        message: "You can upload a maximum of 5 banner images",
      });
    }

    const uploadedBanners = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const size = Array.isArray(sizes) ? sizes[i] || "" : sizes;

      // Convert buffer to base64
      const base64Image = `data:${file.mimetype};base64,${file.buffer.toString(
        "base64"
      )}`;

      // Upload to Cloudinary using buffer
      const result = await cloudinary.uploader.upload(base64Image, {
        folder: "event-banners",
      });

      uploadedBanners.push({
        imageUrl: result.secure_url,
        size,
      });
    }

    const saved = await BannerModel.insertMany(uploadedBanners);

    res.status(201).json({
      success: true,
      message: "Banner images uploaded successfully",
      totalImages: saved.length,
      banners: saved,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload banners",
      error: error.message,
    });
  }
};

const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { size } = req.body;

    let updateData = {};

    if (req.file) {
      const file = req.file;
      const base64Image = `data:${file.mimetype};base64,${file.buffer.toString(
        "base64"
      )}`;

      const result = await cloudinary.uploader.upload(base64Image, {
        folder: "event-banners",
      });

      updateData.imageUrl = result.secure_url;
    }

    if (size) {
      updateData.size = size;
    }

    const updatedBanner = await BannerModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedBanner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Banner image updated successfully",
      data: updatedBanner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update banner",
      error: error.message,
    });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await BannerModel.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // Extract public_id from URL
    // Example: https://res.cloudinary.com/demo/image/upload/v17123456/event-banners/xyz.jpg
    const urlParts = banner.imageUrl.split("/");
    const fileNameWithExt = urlParts[urlParts.length - 1]; // xyz.jpg
    const folderName = urlParts[urlParts.length - 2]; // event-banners
    const publicId = `${folderName}/${fileNameWithExt.split(".")[0]}`; // event-banners/xyz

    await cloudinary.uploader.destroy(publicId);

    await BannerModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Banner image deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete banner",
      error: error.message,
    });
  }
};

export { deleteBanner, getAllBanners, updateBanner, uploadBanners };
