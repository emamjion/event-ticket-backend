import OrderModel from "../models/orderModel.js";
import SellerModel from "../models/sellerModel.js";

// Seller's Earnings Controller
const getSellerEarnings = async (req, res) => {
  try {
    const userId = req.user.id;

    // find seller from userId
    const seller = await SellerModel.findOne({ userId });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    const sellerId = seller._id;

    // Get all orders of this seller
    const orders = await OrderModel.find({ sellerId });

    let totalEarnings = 0;
    let totalTicketsSold = 0;

    orders.forEach((order) => {
      totalEarnings += order.totalAmount;
      totalTicketsSold += order.quantity;
    });

    res.status(200).json({
      success: true,
      message: "Seller earnings fetched successfully",
      data: {
        totalEarnings,
        totalTicketsSold,
        orders,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching earnings",
      error: error.message,
    });
  }
};

export { getSellerEarnings };
