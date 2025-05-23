const createCoupon = async (req, res) => {
  try {
    const sellerId = await getSellerId(req.user);
    const { eventId, code, discountPercentage, startDate, endDate } = req.body;

    const existing = await CouponModel.findOne({ code });
    if (existing) {
      return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }

    const newCoupon = new CouponModel({
      sellerId,
      eventId,
      code,
      discountPercentage,
      startDate,
      endDate,
    });

    await newCoupon.save();
    res.status(201).json({ success: true, message: "Coupon created, pending approval", coupon: newCoupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};