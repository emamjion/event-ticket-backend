import mongoose from "mongoose";
import Stripe from "stripe";
import BookingModel from "../models/booking.model.js";
import EventModel from "../models/eventModel.js";
import OrderModel from "../models/orderModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
      paymentStatus: "pending",
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
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "orderId is required." });
  }

  try {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.paymentStatus === "success") {
      return res
        .status(400)
        .json({ message: "Payment already confirmed for this order." });
    }

    // Step 1: Retrieve payment intent status from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      order.paymentIntentId
    );

    if (paymentIntent.status !== "succeeded") {
      order.paymentStatus = "failed";
      await order.save();
      return res.status(400).json({
        success: false,
        message: "Payment not successful.",
        status: paymentIntent.status,
      });
    }

    // Step 2: Update Order
    order.paymentStatus = "success";
    await order.save();

    // Step 3: Update Booking
    await BookingModel.findByIdAndUpdate(order.bookingId, {
      status: "success",
      isPaid: true,
      paymentIntentId: order.paymentIntentId,
    });

    // Step 4: Update Event
    const event = await EventModel.findById(order.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const remainingSeats = event.seats.filter((seat) => {
      return !order.seats.some(
        (bookedSeat) =>
          bookedSeat.section === seat.section &&
          bookedSeat.row === seat.row &&
          bookedSeat.seatNumber === seat.seatNumber
      );
    });

    const ticketsSoldCount = order.seats.length;

    event.seats = remainingSeats;
    event.ticketSold += ticketsSoldCount;

    await event.save();

    return res.status(200).json({
      success: true,
      message: "Payment confirmed, seats booked successfully.",
    });
  } catch (error) {
    console.error("Confirm Payment error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message || error,
    });
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

    // 🧾 Seller/Admin Logic for reserved booking (unpaid)
    if ((user.role === "admin" || user.role === "seller") && !booking.isPaid) {
      const sellerId = await getSellerId(user);

      if (booking.buyerId.toString() !== sellerId.toString()) {
        return res
          .status(403)
          .json({ message: "Unauthorized to cancel this booking." });
      }

      const event = await EventModel.findById(booking.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found." });
      }

      booking.seats.forEach((seat) => {
        event.seats = event.seats.filter(
          (s) =>
            !(
              s.section === seat.section &&
              s.row === seat.row &&
              s.seatNumber === seat.seatNumber
            )
        );
        event.soldTickets = event.soldTickets.filter(
          (s) =>
            !(
              s.section === seat.section &&
              s.row === seat.row &&
              s.seatNumber === seat.seatNumber
            )
        );
      });

      event.ticketSold -= booking.seats.length;
      event.ticketsAvailable += booking.seats.length;

      booking.status = "cancelled";
      booking.isPaid = false;

      await Promise.all([booking.save(), event.save()]);

      return res.status(200).json({
        success: true,
        message: "Reserved booking cancelled successfully (Admin/Seller)",
      });
    }

    // 💳 Buyer Logic for paid booking
    if (user.role === "buyer" && booking.isPaid) {
      if (booking.status === "cancelled") {
        return res.status(400).json({ message: "Booking already cancelled" });
      }

      const refund = await stripe.refunds.create({
        payment_intent: booking.paymentIntentId,
      });

      if (refund.status !== "succeeded") {
        return res.status(400).json({ message: "Refund failed. Try again." });
      }

      const event = await EventModel.findById(booking.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

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

      booking.status = "cancelled";
      booking.isPaid = false;
      booking.isTicketAvailable = false;
      booking.isUserVisible = false;

      await OrderModel.findOneAndUpdate(
        { bookingId: booking._id },
        { isUserVisible: false }
      );

      await Promise.all([event.save(), booking.save()]);

      return res.status(200).json({
        success: true,
        message: "Paid booking cancelled & refund successful (Buyer)",
        refundId: refund.id,
      });
    }

    return res.status(400).json({
      message: "Invalid booking cancel attempt or you’re not authorized.",
    });
  } catch (err) {
    console.error("Cancel Booking Error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
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
