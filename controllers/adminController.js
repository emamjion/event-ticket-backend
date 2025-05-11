import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import OrderModel from "../models/orderModel.js";
import SellerModel from "../models/sellerModel.js";
import SellerRequestModel from "../models/sellerRequestModel.js";
import UserModel from "../models/userModel.js";
import TicketModel from "../models/ticketModel.js";

// add new user by admin panel
const addNewUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    res.status(201).json({
      success: true,
      message: "User created successfully by admin.",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// update user role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ["admin", "user", "buyer", "seller"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: { role } },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get All Users
const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find();
    res.status(200).json({
      success: true,
      message: "All users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await UserModel.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: deletedUser,
    });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

// Block user by id
const blockUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserModel.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.isBlocked) {
      return res
        .status(400)
        .json({ success: false, message: "User is already blocked" });
    }

    user.isBlocked = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User has been blocked successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// unblock user by id
const unblockUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserModel.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.isBlocked) {
      return res
        .status(400)
        .json({ success: false, message: "User is already active" });
    }

    user.isBlocked = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User has been unblocked successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// function to get all sold tickets
const getAllSoldTickets = async (req, res) => {
  try {
    const soldTickets = await OrderModel.find({ paymentStatus: "paid" })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All sold tickets fetched successfully",
      data: soldTickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// function to get all sellers
const getAllSellers = async (req, res) => {
  try {
    const sellers = await SellerModel.find().populate("userId", "name email");

    res.status(200).json({
      success: true,
      message: "All sellers fetched successfully",
      total: sellers.length,
      sellers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get sellers",
      error: error.message,
    });
  }
};

// function to get all pending sellers
const getPendingSellerRequests = async (req, res) => {
  try {
    const requests = await SellerRequestModel.find({ status: "pending" });

    res.status(200).json({
      success: true,
      message: "All pending seller requests fetched successfully.",
      total: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch requests",
      error: error.message,
    });
  }
};

// function to approve seler request
const approveSellerRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await SellerRequestModel.findById(requestId);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    // Check if user exists
    let user = await UserModel.findOne({ email: request.email });

    if (!user) {
      // Hash the default password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("123456", salt);

      // Create new user with hashed password
      user = await UserModel.create({
        name: request.name,
        email: request.email,
        password: hashedPassword,
        role: "seller",
      });
    } else {
      // If user exists, update role
      user.role = "seller";
      await user.save();
    }

    // Check if Seller profile already exists
    const existingSeller = await SellerModel.findOne({ userId: user._id });

    if (!existingSeller) {
      // Create seller profile only if not already exists
      await SellerModel.create({
        userId: user._id,
        name: user.name,
        email: user.email,
        shopName: request.shopName,
        bio: request.bio,
        contactNumber: request.contactNumber,
        address: request.address,
        website: request.website,
        isVerified: true,
      });
    }

    // Update request status
    request.status = "approved";
    await request.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET_TOKEN,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: "Seller approved & account ready",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Approval failed",
      error: error.message,
    });
  }
};

// function to deny seller request
const denySellerRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await SellerRequestModel.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Seller request not found",
      });
    }

    // Update status to denied
    request.status = "denied";
    await request.save();

    res.status(200).json({
      success: true,
      message: "Seller request has been denied",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to deny request",
      error: error.message,
    });
  }
};

// function to monitor seller acitvity
const monitorSellerActivity = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // SellerModel theke seller khuja hocche & tar user info populate hocche
    const seller = await SellerModel.findById(sellerId).populate(
      "userId",
      "name email"
    );
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // TicketModel theke seller er sold tickets gulo fetch kora hocche
    const soldTickets = await TicketModel.find({
      sellerId: sellerId,
      isSold: true,
    }).populate("buyerId", "name email");

    res.status(200).json({
      success: true,
      message: `Sold tickets fetched for seller: ${seller.userId.name}`,
      total: soldTickets.length,
      soldTickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch seller activity",
      error: error.message,
    });
  }
};

export {
  addNewUserByAdmin,
  approveSellerRequest,
  blockUserById,
  deleteUser,
  denySellerRequest,
  getAllSellers,
  getAllSoldTickets,
  getAllUsers,
  getPendingSellerRequests,
  monitorSellerActivity,
  unblockUserById,
  updateUserRole,
};
