import OrderModel from "../models/orderModel.js";
import SellerModel from "../models/sellerModel.js";

const withdrawEarnings = async (req, res) => {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findOne({ userId });
    if (!seller)
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });

    const { amount } = req.body;

    // Validate payment method exists
    if (!seller.paymentInfo || seller.paymentInfo.status !== "verified") {
      return res.status(400).json({
        success: false,
        message: "Your payment method is not verified",
      });
    }

    // Calculate total earnings from orders
    const orders = await OrderModel.find({
      sellerId: seller._id,
      paymentStatus: "success",
    });

    const totalEarnings = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Withdraw history: you can track how much already withdrawn
    const alreadyWithdrawn = seller.totalWithdrawn || 0;
    const availableBalance = totalEarnings - alreadyWithdrawn;

    if (amount > availableBalance) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient balance" });
    }

    // Update totalWithdrawn
    seller.totalWithdrawn = alreadyWithdrawn + amount;
    await seller.save();

    // Optionally save withdrawal request
    // You can create a WithdrawalModel for admin tracking

    res.status(200).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      withdrawnAmount: amount,
      remainingBalance: totalEarnings - seller.totalWithdrawn,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { withdrawEarnings };
