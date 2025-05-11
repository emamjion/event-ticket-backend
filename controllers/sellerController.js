import SellerModel from "../models/sellerModel.js";

const createSellerProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const existing = await SellerModel.findOne({ userId });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Seller profile already exists" });
    }

    const { shopName, bio, contactNumber, address, website } = req.body;

    const sellerProfile = await SellerModel.create({
      userId,
      shopName,
      bio,
      contactNumber,
      address,
      website,
      isVerified: false,
    });

    res.status(201).json({
      success: true,
      message: "Seller profile submitted for admin approval",
      profile: sellerProfile,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export { createSellerProfile };
