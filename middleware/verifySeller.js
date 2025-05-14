import UserModel from "../models/userModel.js";

const verifySeller = async (req, res, next) => {
  try {
    const email = req.user.email;
    const user = await UserModel.findOne({ email });
    console.log("email: ", email);

    if (!user || user.role !== "seller") {
      return res.status(403).json({ message: "Access denied. Sellers only." });
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: "Seller verification failed",
      error: error.message,
    });
  }
};

export default verifySeller;
