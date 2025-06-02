import mongoose from "mongoose";
import BookingModel from "../models/booking.model.js";
import OrderModel from "../models/orderModel.js";
import SellerModel from "../models/sellerModel.js";

// helper function
const getSellerId = async (user) => {
  if (user.role === "seller") {
    const seller = await SellerModel.findOne({ userId: user.id });
    if (!seller) throw new Error("Seller not found");
    return seller._id;
  } else if (user.role === "admin") {
    return user.id;
  } else {
    throw new Error("Unauthorized");
  }
};

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const objectUserId = new mongoose.Types.ObjectId(userId);

    const orders = await OrderModel.find({
      buyerId: objectUserId,
      isUserVisible: true,
      $or: [
        { paymentStatus: "success" },
        { paymentStatus: "pending", totalAmount: 0 },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      totalOrders: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
      message: error.message,
    });
  }
};

const getSingleOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await OrderModel.findOne({
      _id: id,
      buyerId: userId,
      isUserVisible: true,
      $or: [
        { paymentStatus: "success" },
        { paymentStatus: "pending", totalAmount: 0 },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order details fetched successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch order details",
      message: error.message,
    });
  }
};

// get my reservation
const getMyReservations = async (req, res) => {
  try {
    const user = req.user;
    const sellerId = await getSellerId(user);

    const bookings = await BookingModel.find({
      buyerId: new mongoose.Types.ObjectId(sellerId),
      isPaid: false,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Reserved bookings fetched successfully",
      total: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Reservation fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch reserved bookings",
      message: error.message,
    });
  }
};

export { getMyOrders, getMyReservations, getSingleOrder };
