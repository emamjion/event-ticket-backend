import mongoose from "mongoose";
import OrderModel from "../models/orderModel.js";
import SellerModel from "../models/sellerModel.js";
import UserModel from "../models/userModel.js";

// const createSellerProfile = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const existing = await SellerModel.findOne({ userId });
//     if (existing) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Seller profile already exists" });
//     }

//     const { shopName, bio, contactNumber, address, website } = req.body;

//     const sellerProfile = await SellerModel.create({
//       userId,
//       shopName,
//       bio,
//       contactNumber,
//       address,
//       website,
//       isVerified: false,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Seller profile submitted for admin approval",
//       profile: sellerProfile,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ success: false, message: "Server error", error: error.message });
//   }
// };

// function to update seller profile
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

// function to get seller profile - self
const getMySellerProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await SellerModel.findOne({ userId }).populate(
      "userId",
      "name"
    );

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Seller profile not found" });
    }

    res.status(200).json({
      success: true,
      message: "Seller profile fetched successfully",
      profile,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// function to get seller profile - public
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

// funtion to delete seller profile - admin and self
const deleteSellerProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const objectId = new mongoose.Types.ObjectId(userId);

    const seller = await SellerModel.findOne({ userId: objectId });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      });
    }

    await SellerModel.deleteOne({ userId: objectId });
    await UserModel.findByIdAndUpdate(userId, { role: "user" });

    return res.status(200).json({
      success: true,
      message: "Seller profile deleted",
    });
  } catch (error) {
    console.error("Delete error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message,
    });
  }
};

// function to update payment info
const updatePaymentInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findOne({ userId });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    const { method, accountNumber, accountName } = req.body;

    seller.paymentInfo = {
      method,
      accountNumber,
      accountName,
      status: "pending", // verification needed
    };

    await seller.save();

    res.status(200).json({
      success: true,
      message: "Payment information updated. Awaiting verification.",
      paymentInfo: seller.paymentInfo,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// function to sold tickets for seller
const getSoldTickets = async (req, res) => {
  try {
    const userId = req.user.id;

    // Seller paowa
    const seller = await SellerModel.findOne({ userId });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Seller-er sold tickets order model theke ana
    const soldTickets = await OrderModel.find({ sellerId: seller._id })
      .populate("buyerId", "name email")
      .populate("eventId", "title date")
      .sort({ orderTime: -1 });

    res.status(200).json({
      success: true,
      message: "Sold tickets fetched successfully",
      totalSoldTickets: soldTickets.length,
      soldTickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  deleteSellerProfile,
  getMySellerProfile,
  getSellerProfileById,
  updatePaymentInfo,
  updateSellerProfile,
  getSoldTickets
};
