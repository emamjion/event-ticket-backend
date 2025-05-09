import SellerModel from "../models/sellerModel.js";
import UserModel from "../models/userModel.js";

// Create Seller Profile
const createSellerProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const existing = await SellerModel.findOne({ userId });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Seller profile already exists" });
    }

    const { shopName, bio, contactNumber, address, website } = req.body;

    const sellerProfile = await SellerModel.create({
      userId,
      shopName,
      bio,
      contactNumber,
      address,
      website,
    });

    await UserModel.findByIdAndUpdate(userId, { role: "seller" });

    res.status(201).json({
      success: true,
      message: "Seller profile created",
      profile: sellerProfile,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Update Seller Profile
const updateSellerProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const updated = await SellerModel.findOneAndUpdate(
      { userId },
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Seller profile not found" });
    }

    res.status(200).json({
      success: true,
      message: "Seller profile updated",
      profile: updated,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Update failed", error: error.message });
  }
};

// Get Current Seller Profile (self)
const getMySellerProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await SellerModel.findOne({ userId }).populate(
      "userId",
      "name email"
    );

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Seller profile not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      profile,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get Public Seller Profile by userId (optional)
const getSellerProfileById = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await SellerModel.findOne({ userId }).populate(
      "userId",
      "name email"
    );

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    res.status(200).json({
      success: true,
      message: "Seller profile fetched successfully",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch seller",
      error: error.message,
    });
  }
};

// Delete Seller Profile (admin or self — optional)
const deleteSellerProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const deleted = await SellerModel.findOneAndDelete({ userId });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Seller profile not found" });
    }

    // Optional: Update user role to 'user'
    await UserModel.findByIdAndUpdate(userId, { role: "user" });

    res.status(200).json({
      success: true,
      message: "Seller profile deleted",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Delete failed", error: error.message });
  }
};

export {
  createSellerProfile,
  deleteSellerProfile,
  getMySellerProfile,
  getSellerProfileById,
  updateSellerProfile,
};
