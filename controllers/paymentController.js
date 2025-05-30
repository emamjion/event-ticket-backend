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

// function to cancel paid booking
// const cancelPaidBooking = async (req, res) => {
//   const { bookingId } = req.params;

//   try {
//     const booking = await BookingModel.findById(bookingId);
//     if (!booking) return res.status(404).json({ message: "Booking not found" });

//     if (booking.status === "cancelled")
//       return res.status(400).json({ message: "Booking already cancelled" });

//     if (!booking.isPaid)
//       return res
//         .status(400)
//         .json({ message: "Booking is not paid. Use unpaid cancel route." });

//     // Refund payment
//     const refund = await stripe.refunds.create({
//       payment_intent: booking.paymentIntentId,
//     });

//     if (refund.status !== "succeeded") {
//       return res.status(400).json({ message: "Refund failed. Try again." });
//     }

//     // Remove booked seats from event
//     const event = await EventModel.findById(booking.eventId);
//     if (!event) return res.status(404).json({ message: "Event not found" });

//     booking.seats.forEach((seat) => {
//       event.seats = event.seats.filter(
//         (s) =>
//           !(
//             s.section === seat.section &&
//             s.row === seat.row &&
//             s.seatNumber === seat.seatNumber
//           )
//       );
//       event.soldTickets = event.soldTickets.filter(
//         (s) =>
//           !(
//             s.section === seat.section &&
//             s.row === seat.row &&
//             s.seatNumber === seat.seatNumber
//           )
//       );
//     });

//     event.ticketSold -= booking.seats.length;
//     event.ticketsAvailable += booking.seats.length;

//     booking.status = "cancelled";
//     booking.isPaid = false;

//     await Promise.all([event.save(), booking.save()]);

//     res.status(200).json({
//       success: true,
//       message: "Booking cancelled & refund successful",
//       refundId: refund.id,
//     });
//   } catch (err) {
//     console.error("Refund Error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

const cancelPaidBooking = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await BookingModel.findById(bookingId);
    console.log("booking: ", booking);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking already cancelled" });
    }

    if (!booking.isPaid) {
      return res
        .status(400)
        .json({ message: "Booking is not paid. Use unpaid cancel route." });
    }

    // ✅ Refund payment via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: booking.paymentIntentId,
    });

    if (refund.status !== "succeeded") {
      return res.status(400).json({ message: "Refund failed. Try again." });
    }

    // ✅ Update Event (restore seats)
    const event = await EventModel.findById(booking.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Add back the cancelled seats
    booking.seats.forEach((seat) => {
      event.seats.push(seat); // Restore seat to available seats
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

    // ✅ Update Booking
    booking.status = "cancelled";
    booking.isPaid = false;

    await Promise.all([event.save(), booking.save()]);

    res.status(200).json({
      success: true,
      message: "Booking cancelled & refund successful",
      refundId: refund.id,
    });
  } catch (err) {
    console.error("Refund Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export { cancelPaidBooking, confirmPayment, createPayment };
