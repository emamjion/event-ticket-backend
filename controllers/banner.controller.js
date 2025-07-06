import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import BannerModel from "../models/banner.model.js";

const getAllBanners = async (req, res) => {
  try {
    const banners = await BannerModel.find();
    res.json({
      success: true,
      message: "Banner images fetched successfully!",
      banners: banners,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch banners" });
  }
};

const uploadBanners = async (req, res) => {
  try {
    const sizes = req.body.sizes || [];
    const files = req.files;

    const uploadedBanners = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const size = Array.isArray(sizes) ? sizes[i] || "" : sizes;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "event-banners",
      });

      // Delete local file
      fs.unlinkSync(file.path);

      uploadedBanners.push({
        imageUrl: result.secure_url,
        size,
      });
    }

    const saved = await BannerModel.insertMany(uploadedBanners);

    res.status(201).json({
      success: true,
      message: "Banner images uploaded successfully",
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
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "event-banners",
      });

      updateData.imageUrl = result.secure_url;

      fs.unlinkSync(req.file.path);
    }

    if (size) {
      updateData.size = size;
    }

    const updatedBanner = await BannerModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

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
