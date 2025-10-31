import jwt from "jsonwebtoken";
import UserModel from "../models/userModel.js";

const verifyModerator = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "moderator") {
      return res
        .status(403)
        .json({ message: "Access denied. Moderators only." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res
      .status(401)
      .json({ message: "Invalid or expired token", error: error.message });
  }
};

export default verifyModerator;
