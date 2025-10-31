import bcrypt from "bcryptjs";
import { Parser } from "json2csv";
import jwt from "jsonwebtoken";
import EventModel from "../models/eventModel.js";
import OrderModel from "../models/orderModel.js";
import SellerModel from "../models/sellerModel.js";
import SellerRequestModel from "../models/sellerRequestModel.js";
import UserModel from "../models/userModel.js";

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
    const soldTickets = await OrderModel.find({ paymentStatus: "success" })
      .populate("buyerId", "name email")
      .populate("eventId", "title date")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All sold tickets fetched successfully",
      totalSoldTickets: soldTickets.length,
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
    let user = await UserModel.findOne({ email: request.email });

    if (!user) {
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("123456", salt);

        // Create new user
        user = await UserModel.create({
          name: request.name,
          email: request.email,
          password: hashedPassword,
          role: "seller",
        });

        // console.log("New user created:", user.email);
      } catch (err) {
        console.error("User creation error:", err.message);
        return res
          .status(500)
          .json({ success: false, message: "Failed to create user" });
      }
    } else {
      user.role = "seller";
      await user.save();
      // console.log("Existing user role updated to seller:", user.email);
    }

    const existingSeller = await SellerModel.findOne({ userId: user._id });

    if (!existingSeller) {
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

      console.log("Seller profile created for:", user.email);
    } else {
      console.log("Seller profile already exists for:", user.email);
    }

    // Approve the request
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
    console.error("Approval error:", error.message);
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
    const soldTickets = await EventModel.find({
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

// function to verify seller payment info
const verifySellerPaymentInfo = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await SellerModel.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    if (!seller.paymentInfo || !seller.paymentInfo.accountNumber) {
      return res.status(400).json({
        success: false,
        message: "Seller has no payment info to verify",
      });
    }

    seller.paymentInfo.status = "verified";
    await seller.save();

    res.status(200).json({
      success: true,
      message: "Seller payment info verified successfully",
      paymentInfo: seller.paymentInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// function to get all events
const getAllEventsForAdmin = async (req, res) => {
  try {
    const events = await EventModel.find().sort({ createdAt: -1 }); // newest first

    res.status(200).json({
      success: true,
      message: "All events fetched successfully",
      total: events.length,
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};

// function to view all transactions - simple
// const getAllTransactions = async (req, res) => {
//   try {
//     const transactions = await OrderModel.find()
//       .populate("buyerId", "name email")
//       .populate("sellerId", "name email")
//       .populate("eventId", "title date location")
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       total: transactions.length,
//       data: transactions,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch transactions",
//       error: error.message,
//     });
//   }
// };

// function to view all transactions - with pagination, search, filter and csv download
const getAllTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      paymentStatus,
      startDate,
      endDate,
      format,
    } = req.query;

    const query = {};

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const transactions = await OrderModel.find(query)
      .populate("buyerId", "name email")
      .populate("sellerId", "name email")
      .populate("eventId", "title date location")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await OrderModel.countDocuments(query);

    // CSV export
    if (format === "csv") {
      const fields = [
        "buyerId.name",
        "buyerId.email",
        "sellerId.name",
        "sellerId.email",
        "eventId.title",
        "eventId.date",
        "paymentStatus",
        "totalAmount",
        "quantity",
        "createdAt",
      ];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(transactions);
      res.header("Content-Type", "text/csv");
      res.attachment("transactions.csv");
      return res.send(csv);
    }

    res.status(200).json({
      success: true,
      message: "All transactions fetched successfully",
      total,
      totalTransactions: transactions.length,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Transaction fetching failed",
      error: error.message,
    });
  }
};

// function to all bookings
const getAllBookings = async (req, res) => {
  try {
    const orders = await OrderModel.find()
      .sort({ createdAt: -1 })
      .populate("buyerId", "name email")
      .populate("eventId", "title date");

    res.status(200).json({
      success: true,
      totalBookings: orders.length,
      message: "All Orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};


// function to create moderator
const createModerator = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const moderator = new UserModel({
      name,
      email,
      password: hashedPassword,
      profileImg: null,
      role: "moderator",
    });

    await moderator.save();

    res.status(201).json({
      success: true,
      message: "Moderator created successfully",
      moderator,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

const getAllModerators = async (req, res) => {
  try {
    const moderators = await UserModel.find({ role: "moderator" }).select(
      "name email contactNumber address profileImg createdAt"
    );

    if (!moderators || moderators.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No moderators found" });
    }

    res.status(200).json({
      success: true,
      message: "Moderators fetched successfully",
      total: moderators.length,
      moderators,
    });
  } catch (error) {
    console.error("Error fetching moderators:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching moderators",
      error: error.message,
    });
  }
};

const getSingleModerator = async (req, res) => {
  try {
    const { id } = req.params;

    const moderator = await UserModel.findOne({
      _id: id,
      role: "moderator",
    }).select("name email contactNumber address profileImg createdAt");

    if (!moderator) {
      return res
        .status(404)
        .json({ success: false, message: "Moderator not found" });
    }

    res.status(200).json({
      success: true,
      success: "Moderator Details fetched successfully",
      moderator,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const deleteModerator = async (req, res) => {
  try {
    const { id } = req.params;

    const moderator = await UserModel.findOneAndDelete({
      _id: id,
      role: "moderator",
    });

    if (!moderator) {
      return res
        .status(404)
        .json({ success: false, message: "Moderator not found" });
    }

    res.status(200).json({
      success: true,
      message: "Moderator deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

const updateModerator = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const moderator = await UserModel.findOneAndUpdate(
      { _id: id, role: "moderator" },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!moderator) {
      return res.status(404).json({
        success: false,
        message: "Moderator not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Moderator updated successfully",
      moderator,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
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
  getAllBookings,
  getAllEventsForAdmin,
  getAllSellers,
  getAllSoldTickets,
  getAllTransactions,
  getAllUsers,
  getPendingSellerRequests,
  monitorSellerActivity,
  unblockUserById,
  updateUserRole,
  verifySellerPaymentInfo,
  createModerator,
  getAllModerators,
  getSingleModerator,
  updateModerator,
  deleteModerator
};
