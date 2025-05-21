import OrderModel from "../models/orderModel.js";
import SellerModel from "../models/sellerModel.js";
import UserModel from "../models/userModel.js";

// Sales report controller function
const generateSalesReport = async (req, res) => {
  try {
    const soldOrders = await OrderModel.find({ paymentStatus: "success" });

    const totalRevenue = soldOrders.reduce(
      (total, order) => total + order.totalAmount,
      0
    );

    res.status(200).json({
      success: true,
      message: "Sales report generated successfully",
      totalSales: soldOrders.length,
      totalRevenue,
      orders: soldOrders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate sales report",
      error: error.message,
    });
  }
};

// User report controller function
const generateUserReport = async (req, res) => {
  try {
    const totalUsers = await UserModel.countDocuments();
    const totalSellers = await SellerModel.countDocuments();

    res.status(200).json({
      success: true,
      message: "User report generated successfully",
      totalUsers,
      totalUsersNumber: totalUsers.length,
      totalSellers,
      totalSellersNumber: totalSellers.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate user report",
      error: error.message,
    });
  }
};

// Transaction report controller function
const generateTransactionReport = async (req, res) => {
  try {
    const successPayments = await OrderModel.countDocuments({
      paymentStatus: "success",
    });
    const pendingPayments = await OrderModel.countDocuments({
      paymentStatus: "pending",
    });
    const failedPayments = await OrderModel.countDocuments({
      paymentStatus: "failed",
    });

    res.status(200).json({
      success: true,
      message: "Transaction report generated successfully",
      successPayments,
      successPaymentsNumber: successPayments.length,
      pendingPayments,
      pendingPaymentsNumber: pendingPayments.length,
      failedPayments,
      failedPaymentsNumber: failedPayments.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate transaction report",
      error: error.message,
    });
  }
};

export { generateSalesReport, generateTransactionReport, generateUserReport };
