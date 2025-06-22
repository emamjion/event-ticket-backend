import mongoose from "mongoose";
import BookingModel from "../models/booking.model.js";
import OrderModel from "../models/orderModel.js";
import SellerModel from "../models/sellerModel.js";

// helper function
const getSellerId = async (user) => {
  if (user.role === "seller") {
    const seller = await SellerModel.findOne({ userId: user.id });
    if (!seller) throw new Error("Seller not found");
    return seller._id;
  } else if (user.role === "admin") {
    return user.id;
  } else {
    throw new Error("Unauthorized");
  }
};

const getMyOrders = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const allOrders = await OrderModel.find({
      buyerId,
      paymentStatus: "success",
      isUserVisible: true,
    })
      .populate("eventId", "title date")
      .sort({ createdAt: -1 });
    // console.log("all orders: ", allOrders);

    if (!allOrders.length) {
      return res.status(200).json({
        success: true,
        message: "No orders found",
        totalOrders: 0,
        data: [],
      });
    }

    const updatedOrders = allOrders.map((order) => {
      const activeSeats = order.seats.filter((seat) => !seat.isCancelled);

      // Debug
      // console.log("Order ID:", order._id);
      // console.log("Total seats:", order.seats.length);
      // console.log("Active seats:", activeSeats.length);

      if (activeSeats.length === 0) {
        return null;
      }

      return {
        _id: order._id,
        eventTitle: order.eventId?.title || "Untitled Event",
        eventId: order.eventId,
        eventDate: order.eventId?.date || "N/A",
        bookingId: order.bookingId,
        seats: activeSeats,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      };
    });

    const filteredOrders = updatedOrders.filter(Boolean);

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      totalOrders: filteredOrders.length,
      data: filteredOrders,
    });
  } catch (error) {
    console.error("Error in getMyOrders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

const getSingleOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await OrderModel.findOne({
      _id: id,
      buyerId: userId,
      isUserVisible: true,
      $or: [
        { paymentStatus: "success" },
        { paymentStatus: "pending", totalAmount: 0 },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order details fetched successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch order details",
      message: error.message,
    });
  }
};

// get my reservation - seller/admin
// const getMyReservations = async (req, res) => {
//   try {
//     const user = req.user;
//     const sellerId = await getSellerId(user);

//     const bookings = await BookingModel.find({
//       buyerId: new mongoose.Types.ObjectId(sellerId),
//       isPaid: false,
//     }).sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       message: "Reserved bookings fetched successfully",
//       total: bookings.length,
//       data: bookings,
//     });
//   } catch (error) {
//     console.error("Reservation fetch error:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch reserved bookings",
//       message: error.message,
//     });
//   }
// };

const getMyReservations = async (req, res) => {
  try {
    const user = req.user;
    const sellerId = await getSellerId(user); // current logged-in seller/admin ID

    // Step 1: Cancelled booking gulo database theke completely delete kore dicchi
    await BookingModel.deleteMany({
      buyerId: new mongoose.Types.ObjectId(sellerId),
      status: "cancelled",
    });

    // Step 2: Active reservation gulo fetch kortesi, jeigulo cancelled na
    const bookings = await BookingModel.find({
      buyerId: new mongoose.Types.ObjectId(sellerId),
      isPaid: false,
      status: "reserved",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Reserved bookings fetched successfully",
      total: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Reservation fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch reserved bookings",
      message: error.message,
    });
  }
};

export { getMyOrders, getMyReservations, getSingleOrder };
