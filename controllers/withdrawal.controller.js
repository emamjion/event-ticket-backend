import SellerModel from "../models/sellerModel.js";
import WithdrawalRequestModel from "../models/withdrawalRequest.model.js";

// Seller: Create withdrawal request
const createWithdrawalRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findOne({ userId });

    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    const { amount } = req.body;

    if (amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Amount must be greater than 0" });
    }

    const newRequest = new WithdrawalRequestModel({
      sellerId: seller._id,
      amount,
    });

    await newRequest.save();

    res.status(201).json({
      success: true,
      message: "Withdrawal request created successfully",
      request: newRequest,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: Approve/Reject withdrawal request
const handleWithdrawalRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // "approved" or "rejected"

    if (!["approved", "rejected"].includes(action)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    const request = await WithdrawalRequestModel.findById(requestId);

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    request.status = action;
    request.processedAt = new Date();
    await request.save();

    res.status(200).json({
      success: true,
      message: `Withdrawal request ${action} successfully`,
      request,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Seller: View own withdrawal requests
const getMyWithdrawalRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findOne({ userId });

    const requests = await WithdrawalRequestModel.find({
      sellerId: seller._id,
    }).sort({ requestedAt: -1 });

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export {
  createWithdrawalRequest,
  getMyWithdrawalRequests,
  handleWithdrawalRequest,
};
