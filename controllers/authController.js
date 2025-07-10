import bcrypt from "bcryptjs";
import transporter from "../config/nodeMailer.js";
import UserModel from "../models/userModel.js";
import { createToken } from "../utils/jwtToken.js";

// create user normal system
// const createUser = async (req, res) => {
//   try {
//     const { name, email, password, contactNumber } = req.body;

//     // Check if user already exists
//     const existingUser = await UserModel.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: "User already exists with this email",
//       });
//     }

//     // Hash the password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const newUser = new UserModel({
//       name,
//       email,
//       password: hashedPassword,
//       contactNumber,
//     });

//     await newUser.save();

//     // Sending welcome email
//     const mailOptions = {
//       from: process.env.SENDER_EMAIL,
//       to: email,
//       subject: "Welcome to Events n Tickets",
//       text: `Welcome to Events n Tickets website. Your account has been created with email: ${email}`,
//     };

//     await transporter.sendMail(mailOptions);

//     res.status(201).json({
//       success: true,
//       message: "User created successfully",
//       data: {
//         _id: newUser._id,
//         name: newUser.name,
//         email: newUser.email,
//         role: newUser.role,
//         password: "*****",
//         contactNumber: contactNumber,
//       },
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: "Failed to create user",
//       error: error.message,
//     });
//   }
// };

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

// Send verification OTP to the User's Email
// const sendVerifyOtp = async (req, res) => {
//   try {
//     const { id } = req.user;
//     const user = await UserModel.findById(id);
//     if (user.isAccountVerified) {
//       return res.status(400).json({
//         success: false,
//         message: "Account has already been verified.",
//       });
//     }
//     const otp = String(Math.floor(100000 + Math.random() * 900000));
//     user.verifyOtp = otp;
//     user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
//     await user.save();

//     const mailOptions = {
//       from: process.env.SENDER_EMAIL,
//       to: user.email,
//       subject: "Account Verification OTP",
//       text: `Your OTP is ${otp}. Verify your account using this OTP.`,
//     };

//     res.status(200).json({
//       success: true,
//       message: `Verification OTP sent on your Email: ${user.email}`,
//     });

//     await transporter.sendMail(mailOptions);
//   } catch (error) {
//     console.log("Error in Send Verify OTP: ", error.message);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// function to verify email using otp
// const verifyEmail = async (req, res) => {
//   const { id } = req.user;
//   const { otp } = req.body;
//   if (!id || !otp) {
//     return (
//       res.status(400),
//       json({
//         success: false,
//         message: "Missing details",
//       })
//     );
//   }

//   try {
//     const user = await UserModel.findById(id);
//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     if (user.verifyOtp === "" || user.verifyOtp !== otp) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid OTP",
//       });
//     }

//     if (user.verifyOtpExpireAt < Date.now()) {
//       return res.statu(400).json({
//         success: false,
//         message: "OTP Expired",
//       });
//     }
//     user.isAccountVerified = true;
//     user.verifyOtp = "";
//     user.verifyOtpExpireAt = 0;
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: "Email verified successfully",
//     });
//   } catch (error) {
//     console.log("Error in Verify Email: ", error.message);
//     res.status(500).json({
//       success: false,
//       message: "Verify Email Error",
//       error: error.message,
//     });
//   }
// };

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

// forget password functionality
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found with this email." });
    }

    // .0Create JWT Reset Token (valid for 15 mins)
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET_TOKEN,
      { expiresIn: "15m" }
    );

    // Password reset link
    const resetLink = `https://www.eventsntickets.com.au/reset-password?token=${token}`;

    // ✉️ Send email using nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail", // Or use custom SMTP
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Ticket Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset your password",
      html: `
        <p>Hello ${user.name || "User"},</p>
        <p>Click the link below to reset your password (valid for 15 minutes):</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>If you didn't request this, just ignore this email.</p>
      `,
    });

    res.status(200).json({ message: "Reset link sent to email." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export { createUser, isAuthenticated, loginUser, logoutUser, verifyOtp };
