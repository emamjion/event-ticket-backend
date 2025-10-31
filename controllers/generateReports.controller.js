import OrderModel from "../models/orderModel.js";
import SellerModel from "../models/sellerModel.js";
import TicketModel from "../models/ticket.model.js";
import UserModel from "../models/userModel.js";

// Sales report controller function
const generateSalesReport = async (req, res) => {
  try {
    const soldOrders = await OrderModel.find({
      paymentStatus: "success",
    })
      .populate("eventId", "title")
      .populate("sellerId", "name organizationName email contactNumber")
      .populate("buyerId", "name email contactNumber");

    const totalRevenue = soldOrders.reduce(
      (total, order) => total + order.totalAmount,
      0
    );

    const ordersWithScanStatus = await Promise.all(
      soldOrders.map(async (order) => {
        const tickets = await TicketModel.find({ orderId: order._id });

        const scanStatuses = tickets.map((t) => t.scanStatus);

        return {
          ...order.toObject(),
          scanStatus:
            scanStatuses.length === 0
              ? "not_scanned"
              : scanStatuses.includes("used")
              ? "used"
              : scanStatuses.includes("valid")
              ? "valid"
              : "not_scanned",
          tickets,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Sales report generated successfully",
      totalSales: soldOrders.length,
      totalRevenue,
      orders: ordersWithScanStatus,
    });
  } catch (error) {
    console.error("Error generating report:", error);
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

    const soldOrders = await OrderModel.find({
      paymentStatus: "success",
    }).select("buyerId");

    const buyerIdSet = new Set(
      soldOrders.map((order) => order.buyerId.toString())
    );
    const buyerIds = [...buyerIdSet];

    const buyers = await UserModel.find({ _id: { $in: buyerIds } });

    res.status(200).json({
      success: true,
      message: "User report generated successfully",
      totalUsers,
      totalSellers,
      totalBuyers: buyers.length,
      buyers,
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
