import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import transporter from "../config/nodeMailer.js";
import UserModel from "../models/userModel.js";
import { createToken } from "../utils/jwtToken.js";
import { generateOTP, hashOTP } from "../utils/otpHelper.js";

const createUser = async (req, res) => {
  try {
    const { name, email, password, contactNumber } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

    // Create new user with OTP
    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword,
      contactNumber,
      verifyOtp: otp,
      verifyOtpExpireAt: otpExpireAt,
      isAccountVerified: false,
    });

    await newUser.save();

    // Welcome email + OTP
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to Events n Tickets - Verify Your Account",
      html: `
        <h3>Hello ${name},</h3>
        <p>Welcome to <strong>Events n Tickets</strong>!</p>
        <p>Your account has been created successfully. To activate your account, please use the OTP below:</p>
        <h2>${otp}</h2>
        <p>This OTP is valid for 24 hours.</p>
        <br/>
        <p>Thank you,<br/>Events n Tickets Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: "Account created. OTP sent to your email.",
      userId: newUser._id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
};

// Login Route
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = createToken({
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// logout route
const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isAccountVerified) {
      return res.status(400).json({
        success: false,
        message: "Account already verified",
      });
    }

    if (user.verifyOtp !== otp || Date.now() > user.verifyOtpExpireAt) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.isAccountVerified = true;
    user.verifyOtp = null;
    user.verifyOtpExpireAt = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Account verified successfully. Please log in now.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "OTP verification failed",
      error: error.message,
    });
  }
};

// check user is authenticated
const isAuthenticated = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Authenticated!",
    });
  } catch (error) {
    console.log("Error in authenticated controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Authenticated controller error",
      error: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ message: "Token and new password are required." });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password change successful." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res
      .status(500)
      .json({ message: "Token expired or invalid.", error: error.message });
  }
};

const sendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    const otp = generateOTP();
    const hashedOtp = hashOTP(otp);

    user.resetOtp = hashedOtp;
    user.resetOtpExpireAt = Date.now() + 10 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Reset Your Password",
      text: `Your password reset OTP is: ${otp}. It expires in 10 minutes.`,
    });

    res.status(200).json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed in sentResetOtp controller",
      error: error.message,
    });
  }
};

const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    const hashedOtp = hashOTP(otp);

    if (user.resetOtp !== hashedOtp || user.resetOtpExpireAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password reset successful." });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in resetPasswordWithOtp controller",
      error: error.message,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    const userId = req.user?.id;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change Password Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong while changing the password.",
      error: error.message,
    });
  }
};

export {
  changePassword,
  createUser,
  isAuthenticated,
  loginUser,
  logoutUser,
  resetPassword,
  resetPasswordWithOtp,
  sendResetOtp,
  verifyOtp,
};
