import express from "express";
import {
  createUser,
  loginUser,
  logoutUser,
} from "../controllers/authController.js";
import {
  changePassword,
  deleteAccount,
  forgotPassword,
  getProfile,
  resetPassword,
  updateProfile,
} from "../controllers/profileController.js";
import verifyToken from "../middleware/verifyToken.js";

const authRouter = express.Router();

// POST /users — Create New User
authRouter.post("/create-user", createUser);
authRouter.post("/login", loginUser);
authRouter.post("/logout", logoutUser);

// Profile routes (protected)
authRouter.get("/profile", verifyToken, getProfile);
authRouter.put("/profile", verifyToken, updateProfile);
authRouter.delete("/profile", verifyToken, deleteAccount);

authRouter.put("/change-password", verifyToken, changePassword);
authRouter.post("/forget-password", verifyToken, forgotPassword);
authRouter.post("/reset-password/:token", verifyToken, resetPassword);

export default authRouter;
