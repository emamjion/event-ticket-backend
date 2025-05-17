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
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Check existing order
    const existingOrder = await OrderModel.findOne({ bookingId });
    if (existingOrder) {
      return res.status(400).json({
        message: "Payment already initiated for this booking.",
        orderId: existingOrder._id,
        paymentIntentId: existingOrder.paymentIntentId,
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount * 100),
      currency: "usd",
      metadata: {
        bookingId: booking._id.toString(),
        buyerId: booking.buyerId.toString(),
        eventId: booking.eventId.toString(),
      },
    });

    // Create order with Stripe paymentIntentId
    const newOrder = new OrderModel({
      bookingId,
      buyerId: booking.buyerId,
      eventId: booking.eventId,
      seats: booking.seats,
      totalAmount: booking.totalAmount,
      paymentStatus: "pending",
      paymentIntentId: paymentIntent.id,
    });

    await newOrder.save();

    return res.status(201).json({
      success: true,
      message: "Order created, proceed to payment.",
      orderId: newOrder._id,
      clientSecret: paymentIntent.client_secret, // for frontend to confirm payment
      amount: newOrder.totalAmount,
    });
  } catch (error) {
    console.error("Create Payment error:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Confirm Payment: verify payment with Stripe and update order and event
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

    // Retrieve payment intent status from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      order.paymentIntentId
    );

    console.log(paymentIntent.status);

    if (paymentIntent.status !== "succeeded") {
      order.paymentStatus = "failed";
      await order.save();
      return res
        .status(400)
        .json({ success: false, message: "Payment not successful." });
    }

    // Payment success: update order and related models
    order.paymentStatus = "success";
    await order.save();

    await BookingModel.findByIdAndUpdate(order.bookingId, {
      status: "success",
      isPaid: true,
      paymentIntentId: order.paymentIntentId,
    });

    const event = await EventModel.findById(order.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Remove booked seats from event.seats
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

    res
      .status(200)
      .json({ success: true, message: "Payment confirmed, seats booked." });
  } catch (error) {
    console.error("Confirm Payment error:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export { confirmPayment, createPayment };
