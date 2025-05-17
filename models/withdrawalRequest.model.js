import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seller",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: Date,
});

const WithdrawalRequestModel =
  mongoose.models.WithdrawalRequest ||
  mongoose.model("WithdrawalRequest", withdrawalRequestSchema);

export default WithdrawalRequestModel;
