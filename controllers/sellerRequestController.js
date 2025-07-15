import SellerRequestModel from "../models/sellerRequestModel.js";

// function for submitting a seller request
const submitSellerRequest = async (req, res) => {
  try {
    const {
      name,
      email,
      organizationName,
      bio,
      contactNumber,
      address,
      website,
    } = req.body;

    const existing = await SellerRequestModel.findOne({ email });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a seller request.",
      });
    }

    const request = await SellerRequestModel.create({
      name,
      email,
      organizationName,
      bio,
      contactNumber,
      address,
      website,
    });

    res.status(201).json({
      success: true,
      message: "Your request has been submitted successfully.",
      data: request,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export { submitSellerRequest };
