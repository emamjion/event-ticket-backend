import express from "express";
import {
  changePassword,
  createUser,
  isAuthenticated,
  loginUser,
  logoutUser,
  resetPasswordWithOtp,
  sendResetOtp,
  verifyOtp,
} from "../controllers/authController.js";
import {
  deleteAccount,
  getProfile,
  updateProfile,
} from "../controllers/profileController.js";
import upload from "../middleware/multer.js";
import verifyToken from "../middleware/verifyToken.js";

const authRouter = express.Router();

// POST /users — Create New User
authRouter.post("/create-user", createUser);
authRouter.post("/login", loginUser);
authRouter.post("/logout", logoutUser);

// Profile routes (protected)
authRouter.get("/profile", verifyToken, getProfile);
authRouter.put(
  "/profile",
  verifyToken,
  upload.single("profileImg"),
  updateProfile
);
authRouter.delete("/profile", verifyToken, deleteAccount);

authRouter.post("/send-reset-otp", sendResetOtp);
authRouter.post("/reset-password", resetPasswordWithOtp);
authRouter.put("/change-password", verifyToken, changePassword);

// send verify otp route
// authRouter.post("/send-verify-otp", verifyToken, sendVerifyOtp);
// verify account route
authRouter.post("/verify-account", verifyOtp);
authRouter.post("/is-auth", verifyToken, isAuthenticated);

export default authRouter;
