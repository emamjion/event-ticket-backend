import CouponModel from "../models/coupon.model.js";
import SellerModel from "../models/sellerModel.js";

const createCoupon = async (req, res) => {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findOne({ userId });

    if (!seller) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized seller" });
    }

    const { code, discountPercentage, minPrice, startDate, endDate, eventId } =
      req.body;

    const newCoupon = new CouponModel({
      code,
      discountPercentage,
      minPrice,
      startDate,
      endDate,
      eventId,
      sellerId: seller._id,
      status: "approved",
    });

    await newCoupon.save();

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon: newCoupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create coupon",
      error: error.message,
    });
  }
};

// function to update coupon
const updateCoupon = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const userId = req.user.id;
    const seller = await SellerModel.findOne({ userId });

    if (!seller) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized seller" });
    }

    const coupon = await CouponModel.findById(id);
    if (!coupon || coupon.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    if (coupon.sellerId.toString() !== seller._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized for this coupon" });
    }

    Object.assign(coupon, updates);
    await coupon.save();

    res
      .status(200)
      .json({ success: true, message: "Coupon updated", data: coupon });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Update failed", error: error.message });
  }
};

// function to delete coupon
const deleteCoupon = async (req, res) => {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findOne({ userId });

    if (!seller) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized seller" });
    }

    const { id } = req.params;
    const coupon = await CouponModel.findById(id);

    if (!coupon || coupon.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    if (coupon.sellerId.toString() !== seller._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized seller for this coupon",
      });
    }

    coupon.isDeleted = true;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Coupon softly deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
      error: error.message,
    });
  }
};

// function to permanent delete coupon
const permanentDeleteCoupon = async (req, res) => {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findOne({ userId });

    if (!seller) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized seller" });
    }

    const { id } = req.params;
    const coupon = await CouponModel.findById(id);

    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    if (coupon.sellerId.toString() !== seller._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized seller for this coupon",
      });
    }

    await CouponModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
      error: error.message,
    });
  }
};

// function to restore coupon
const restoreCoupon = async (req, res) => {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findOne({ userId });

    if (!seller) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized seller" });
    }

    const { id } = req.params;
    const coupon = await CouponModel.findById(id);

    if (!coupon || !coupon.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found or already active",
      });
    }

    if (coupon.sellerId.toString() !== seller._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized seller for this coupon",
      });
    }

    coupon.isDeleted = false;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Coupon restored successfully",
      coupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to restore coupon",
      error: error.message,
    });
  }
};

// function to toggle coupon status
const toggleCouponStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findOne({ userId });

    if (!seller) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized seller" });
    }

    const { id } = req.params;
    const coupon = await CouponModel.findById(id);

    if (!coupon || coupon.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    if (coupon.sellerId.toString() !== seller._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized access to coupon" });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: `Coupon is now ${coupon.isActive ? "active" : "inactive"}`,
      coupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to toggle coupon status",
      error: error.message,
    });
  }
};

// function to get seller coupons
const getSellerCoupons = async (req, res) => {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findOne({ userId });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }
    const coupons = await CouponModel.find({ sellerId: seller._id });
    res.status(200).json({
      success: true,
      message: "Coupon fetched successfully",
      totalCoupons: coupons.length,
      coupons,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// function to approve coupon
const approveCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedCoupon = await CouponModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedCoupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    res.status(200).json({
      success: true,
      message: `Coupon ${status}`,
      coupon: updatedCoupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update coupon status",
      error: error.message,
    });
  }
};

// function to apply coupon
const applyCoupon = async (req, res) => {
  try {
    const { code, eventId, totalAmount } = req.body;

    const coupon = await CouponModel.findOne({
      code: code.toUpperCase(),
      eventId,
      status: "approved",
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired coupon",
      });
    }

    if (!coupon.isActive) {
      return res
        .status(400)
        .json({ success: false, message: "This coupon is currently inactive" });
    }

    const discountAmount = (coupon.discountPercentage / 100) * totalAmount;
    const finalPrice = totalAmount - discountAmount;

    res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      discountAmount,
      finalPrice,
      couponId: coupon._id,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export {
  applyCoupon,
  approveCoupon,
  createCoupon,
  deleteCoupon,
  getSellerCoupons,
  permanentDeleteCoupon,
  restoreCoupon,
  toggleCouponStatus,
  updateCoupon,
};
