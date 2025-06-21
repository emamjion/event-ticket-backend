import mongoose from "mongoose";
import Stripe from "stripe";
import BookingModel from "../models/booking.model.js";
import EventModel from "../models/eventModel.js";
import OrderModel from "../models/orderModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

// Create Payment: create Stripe payment intent and order

const createPayment = async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ message: "bookingId is required." });
  }

  try {
    // 1. Get booking info
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // 2. Check if order already exists for this booking
    const existingOrder = await OrderModel.findOne({ bookingId });
    if (existingOrder) {
      return res.status(400).json({
        message: "Payment already initiated for this booking.",
        orderId: existingOrder._id,
        paymentIntentId: existingOrder.paymentIntentId,
      });
    }

    // 3. Get event info to fetch sellerId
    const event = await EventModel.findById(booking.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // 4. Calculate quantity from seats length
    const quantity = booking.seats?.length || 1;

    // 5. Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount * 100), // amount in cents
      currency: "usd",
      metadata: {
        bookingId: booking._id.toString(),
        buyerId: booking.buyerId.toString(),
        eventId: booking.eventId.toString(),
      },
    });

    // 6. Create a new order with all required fields
    const newOrder = new OrderModel({
      bookingId,
      buyerId: booking.buyerId,
      sellerId: event.sellerId,
      eventId: booking.eventId,
      seats: booking.seats,
      quantity,
      totalAmount: booking.totalAmount,
      paymentStatus: "success",
      paymentIntentId: paymentIntent.id,
    });

    await newOrder.save();

    // 7. Respond with client secret for frontend payment confirmation
    return res.status(201).json({
      success: true,
      message: "Order created, proceed to payment.",
      orderId: newOrder._id,
      clientSecret: paymentIntent.client_secret,
      amount: newOrder.totalAmount,
    });
  } catch (error) {
    console.error("Create Payment error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message || error,
    });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // 1. Find the booking with matching paymentIntentId
    const booking = await BookingModel.findOne({ paymentIntentId });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    if (booking.isPaid) {
      return res
        .status(400)
        .json({ success: false, message: "Payment already confirmed." });
    }

    // 2. Mark booking as paid and update status
    booking.isPaid = true;
    booking.status = "success";
    await booking.save();

    // 3. Manually set paymentStatus to "success" in Order
    const orderData = {
      bookingId: booking._id,
      buyerId: booking.buyerId,
      eventId: booking.eventId,
      seats: booking.seats,
      totalAmount: booking.totalAmount,
      paymentStatus: "success", // Force set success
      paymentIntentId: booking.paymentIntentId,
      sellerId: req.user?._id,
      quantity: booking.seats.length,
    };

    await OrderModel.create(orderData);

    res.status(200).json({
      success: true,
      message: "Payment confirmed and order created.",
    });
  } catch (error) {
    console.error("Confirm Payment Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

// cancel booking for buyer and seller/admin
const cancelBooking = async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ message: "Booking ID is required." });
  }

  try {
    const user = req.user;
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const event = await EventModel.findById(booking.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // 🔐 Optional: seller/admin validation
    if (user.role === "seller" || user.role === "admin") {
      const sellerId = await getSellerId(user);
      if (booking.buyerId.toString() !== sellerId.toString()) {
        return res
          .status(403)
          .json({ message: "Unauthorized to cancel this booking." });
      }
    }

    // ❌ Already cancelled
    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking already cancelled." });
    }

    // 🔁 Refund logic (if Stripe payment present)
    if (booking.paymentIntentId) {
      const refund = await stripe.refunds.create({
        payment_intent: booking.paymentIntentId,
      });

      if (refund.status !== "succeeded") {
        return res.status(400).json({ message: "Refund failed. Try again." });
      }
    }

    // 🎯 Update event
    booking.seats.forEach((seat) => {
      event.seats = event.seats.filter(
        (s) =>
          !(
            s.section === seat.section &&
            s.row === seat.row &&
            s.seatNumber === seat.seatNumber
          )
      );
    });

    event.soldTickets = event.soldTickets.filter(
      (s) =>
        !booking.seats.some(
          (b) =>
            b.section === s.section &&
            b.row === s.row &&
            b.seatNumber === s.seatNumber
        )
    );

    event.ticketSold -= booking.seats.length;
    event.ticketsAvailable += booking.seats.length;

    // 🎯 Update booking
    booking.status = "cancelled";
    booking.isTicketAvailable = false;
    booking.isUserVisible = false;

    // 🎯 Update order
    await OrderModel.findOneAndUpdate(
      { bookingId: booking._id },
      { isUserVisible: false }
    );

    await Promise.all([booking.save(), event.save()]);

    return res.status(200).json({
      success: true,
      message: booking.paymentIntentId
        ? "Paid booking cancelled & refunded successfully."
        : "Coupon-based booking cancelled successfully.",
    });
  } catch (err) {
    console.error("Cancel Booking Error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

const getCancelledOrders = async (req, res) => {
  const userId = req.user.id;
  const objectUserId = new mongoose.Types.ObjectId(userId);

  const cancelledOrders = await OrderModel.find({
    buyerId: objectUserId,
    paymentStatus: "success",
    status: "cancelled",
    isUserVisible: false,
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "Cancelled orders fetched successfully",
    data: cancelledOrders,
  });
};

export { cancelBooking, confirmPayment, createPayment, getCancelledOrders };
