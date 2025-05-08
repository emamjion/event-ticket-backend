import UserModel from "../models/userModel.js";

const verifyAdmin = async (req, res, next) => {
  try {
    const email = req.user.email;
    const user = await UserModel.findOne({ email });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    next();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Admin verification failed", error: error.message });
  }
};

export default verifyAdmin;
