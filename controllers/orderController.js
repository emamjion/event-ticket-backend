import mongoose from "mongoose";
import OrderModel from "../models/orderModel.js";

// const getMyOrders = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const orders = await OrderModel.find({
//       buyerId: userId,
//       paymentStatus: "success",
//     }).sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       message: "Orders fetched successfully",
//       data: orders,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch orders",
//       message: error.message,
//     });
//   }
// };

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const objectUserId = new mongoose.Types.ObjectId(userId);

    const orders = await OrderModel.find({
      buyerId: objectUserId,
      paymentStatus: "success",
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

    const order = await OrderModel.findOne({ _id: id, buyerId: userId });

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

export { getMyOrders, getSingleOrder };
