import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import UserModel from "../models/userModel.js";

// function to get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // verifyToken middleware use korle req.user.id pabe

    const user = await UserModel.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// function to update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, password, address, contactNumber } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (address) updateData.address = address;
    if (contactNumber) updateData.contactNumber = contactNumber;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const image = req.file;
    if (image) {
      const result = await cloudinary.uploader.upload(image.path);
      const imageUrl = result.secure_url;
      updateData.profileImg = imageUrl;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// function to delete user profile
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const deletedUser = await UserModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete user account",
      error: error.message,
    });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Old password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message,
    });
  }
};

// function to forget password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min

    await user.save();

    // In real life, you'd send this resetToken in email
    console.log(
      `Reset Token (send via email): http://localhost:5000/api/users/reset-password/${resetToken}`
    );

    res.status(200).json({
      success: true,
      message: "Password reset link sent",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send reset link",
      error: error.message,
    });
  }
};

// function to reset password
const resetPassword = async (req, res) => {
  try {
    const token = req.params.token;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await UserModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Token is invalid or expired" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Reset failed", error: error.message });
  }
};

export {
  changePassword,
  deleteAccount,
  forgotPassword,
  getProfile,
  resetPassword,
  updateProfile,
};
