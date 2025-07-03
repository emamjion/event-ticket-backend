import mongoose from "mongoose";
import Stripe from "stripe";
import BookingModel from "../models/booking.model.js";
import EventModel from "../models/eventModel.js";
import OrderModel from "../models/orderModel.js";
import generateTicketPDF from "../utils/generateTicketPDF.js";
import sendTicketEmail from "../utils/sendTicketEmail.js";

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

// phase - 01
// const createPayment = async (req, res) => {
//   const { bookingId } = req.body;

//   if (!bookingId) {
//     return res.status(400).json({ message: "bookingId is required." });
//   }

//   try {
//     // 1. Get booking info
//     const booking = await BookingModel.findById(bookingId);
//     if (!booking) {
//       return res.status(404).json({ message: "Booking not found." });
//     }

//     // 2. Check if order already exists for this booking
//     const existingOrder = await OrderModel.findOne({ bookingId });
//     if (existingOrder) {
//       return res.status(400).json({
//         message: "Payment already initiated for this booking.",
//         orderId: existingOrder._id,
//         paymentIntentId: existingOrder.paymentIntentId,
//       });
//     }

//     // 3. Get event info to fetch sellerId
//     const event = await EventModel.findById(booking.eventId);
//     if (!event) {
//       return res.status(404).json({ message: "Event not found." });
//     }

//     // 4. Calculate quantity from seats length
//     const quantity = booking.seats?.length || 1;

//     // 5. Create Stripe payment intent
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(booking.totalAmount * 100), // amount in cents
//       currency: "usd",
//       metadata: {
//         bookingId: booking._id.toString(),
//         buyerId: booking.buyerId.toString(),
//         eventId: booking.eventId.toString(),
//       },
//     });

//     // 6. Create a new order with all required fields
//     const newOrder = new OrderModel({
//       bookingId,
//       buyerId: booking.buyerId,
//       sellerId: event.sellerId,
//       eventId: booking.eventId,
//       seats: booking.seats,
//       quantity,
//       totalAmount: booking.totalAmount,
//       paymentStatus: "success",
//       paymentIntentId: paymentIntent.id,
//     });

//     await newOrder.save();

//     // 7. Respond with client secret for frontend payment confirmation
//     return res.status(201).json({
//       success: true,
//       message: "Order created, proceed to payment.",
//       orderId: newOrder._id,
//       clientSecret: paymentIntent.client_secret,
//       amount: newOrder.totalAmount,
//     });
//   } catch (error) {
//     console.error("Create Payment error:", error);
//     res.status(500).json({
//       message: "Internal Server Error",
//       error: error.message || error,
//     });
//   }
// };

// phase - 02
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

    // 2. Prevent duplicate payment creation
    const existingOrder = await OrderModel.findOne({ bookingId });
    if (existingOrder) {
      return res.status(400).json({
        message: "Payment already initiated for this booking.",
        orderId: existingOrder._id,
        paymentIntentId: existingOrder.paymentIntentId,
      });
    }

    // 3. Get event info
    const event = await EventModel.findById(booking.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const quantity = booking.seats?.length || 1;

    // 4. Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount * 100),
      currency: "usd",
      metadata: {
        bookingId: booking._id.toString(),
        buyerId: booking.buyerId.toString(),
        eventId: booking.eventId.toString(),
      },
    });

    // 5. Save paymentIntentId to booking
    booking.paymentIntentId = paymentIntent.id;
    await booking.save();

    res.status(201).json({
      success: true,
      message: "Payment intent created. Proceed to payment.",
      bookingId: booking._id,
      clientSecret: paymentIntent.client_secret,
      amount: booking.totalAmount,
      paymentIntentId: booking.paymentIntentId,
    });
  } catch (error) {
    console.error("Create Payment error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message || error,
    });
  }
};

// phase - 01
// const confirmPayment = async (req, res) => {
//   try {
//     const { paymentIntentId } = req.body;

//     // 1. Find the booking with matching paymentIntentId
//     const booking = await BookingModel.findOne({ paymentIntentId });

//     if (!booking) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Booking not found." });
//     }

//     if (booking.isPaid) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Payment already confirmed." });
//     }

//     // 2. Mark booking as paid and update status
//     booking.isPaid = true;
//     booking.status = "success";
//     await booking.save();

//     // 3. Manually set paymentStatus to "success" in Order
//     const orderData = {
//       bookingId: booking._id,
//       buyerId: booking.buyerId,
//       eventId: booking.eventId,
//       seats: booking.seats,
//       totalAmount: booking.totalAmount,
//       paymentStatus: "success", // Force set success
//       paymentIntentId: booking.paymentIntentId,
//       sellerId: req.user?._id,
//       quantity: booking.seats.length,
//     };

//     await OrderModel.create(orderData);

//     res.status(200).json({
//       success: true,
//       message: "Payment confirmed and order created.",
//     });
//   } catch (error) {
//     console.error("Confirm Payment Error:", error);
//     res.status(500).json({ success: false, message: "Something went wrong." });
//   }
// };

// phase - 02
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res
        .status(400)
        .json({ success: false, message: "paymentIntentId is required." });
    }

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

    booking.isPaid = true;
    booking.status = "success";
    booking.isUserVisible = true;
    await booking.save();

    if (booking.recipientEmail) {
      const pdfBuffer = await generateTicketPDF(booking);
      await sendTicketEmail({
        to: booking.recipientEmail,
        subject: "You've received an event ticket",
        note: booking.note,
        pdfBuffer,
        filename: `ticket-${booking._id}.pdf`,
      });
    }

    const existingOrder = await OrderModel.findOne({ bookingId: booking._id });
    if (existingOrder) {
      return res
        .status(400)
        .json({ success: false, message: "Order already exists." });
    }

    const event = await EventModel.findById(booking.eventId);

    const newOrder = new OrderModel({
      bookingId: booking._id,
      buyerId: booking.buyerId,
      eventId: booking.eventId,
      seats: booking.seats,
      totalAmount: booking.totalAmount,
      paymentStatus: "success",
      paymentIntentId: booking.paymentIntentId,
      sellerId: event?.sellerId || null,
      quantity: booking.seats.length,
      isUserVisible: true,
    });

    await newOrder.save();

    console.log("Order saved successfully:", newOrder._id);

    // mail functionality
    const mailOpytions = {
      from: process.env.SENDER_EMAIL,
      to: req.user.email,
      subject: "Your Event Ticket Confirmation",
      html: `
        <h1>Dear, ${req.user.name}</h1>
        <p>This is your ticket</p>
        Testing Ticket -  123456
      `,
    };
    await transporter.sendMail(mailOpytions);

    res.status(200).json({
      success: true,
      message: "Payment confirmed and order created.",
      orderId: newOrder._id,
      order: newOrder,
    });
  } catch (error) {
    console.error("Confirm Payment Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

// cancel booking for buyer and seller/admin
// booking model theke data gulo newa hocche
// const cancelBooking = async (req, res) => {
//   const { bookingId, seatToCancel } = req.body;

//   if (!bookingId || !seatToCancel?._id) {
//     return res.status(400).json({ message: "Booking ID and seat are required." });
//   }

//   try {
//     const booking = await BookingModel.findById(bookingId);
//     if (!booking) return res.status(404).json({ message: "Booking not found." });

//     const event = await EventModel.findById(booking.eventId);
//     if (!event) return res.status(404).json({ message: "Event not found." });

//     // Check if seat exists in booking
//     const seatExists = booking.seats.some(seat => seat._id.toString() === seatToCancel._id);
//     if (!seatExists) return res.status(400).json({ message: "Seat not found in booking." });

//     // Remove seat from booking and event
//     booking.seats = booking.seats.filter(seat => seat._id.toString() !== seatToCancel._id);
//     event.seats = event.seats.filter(seat =>
//       !(seat.section === seatToCancel.section &&
//         seat.row === seatToCancel.row &&
//         seat.seatNumber === seatToCancel.seatNumber)
//     );

//     event.soldTickets = event.soldTickets.filter(seat =>
//       !(seat.section === seatToCancel.section &&
//         seat.row === seatToCancel.row &&
//         seat.seatNumber === seatToCancel.seatNumber)
//     );

//     event.ticketSold -= 1;
//     event.ticketsAvailable += 1;

//     // Partial refund (if payment made)
//     if (booking.paymentIntentId) {
//       const perSeatAmount = booking.totalAmount / (booking.seats.length + 1); // +1 for the removed one
//       const refund = await stripe.refunds.create({
//         payment_intent: booking.paymentIntentId,
//         amount: Math.round(perSeatAmount * 100), // stripe uses cents
//       });
//       if (refund.status !== "succeeded") {
//         return res.status(400).json({ message: "Refund failed." });
//       }

//       booking.totalAmount -= perSeatAmount;
//     }

//     // If no seats left, cancel entire booking
//     if (booking.seats.length === 0) {
//       booking.status = "cancelled";
//       booking.isTicketAvailable = false;
//       booking.isUserVisible = false;
//       await OrderModel.findOneAndUpdate({ bookingId }, { isUserVisible: false });
//     }

//     await Promise.all([booking.save(), event.save()]);

//     return res.status(200).json({
//       success: true,
//       message: "Seat cancelled successfully" + (booking.status === "cancelled" ? " & booking closed." : "."),
//     });

//   } catch (err) {
//     console.error("Cancel Seat Error:", err);
//     return res.status(500).json({ message: "Internal server error.", error: err.message });
//   }
// };

// order model theke data newa hocche -1
// const cancelBooking = async (req, res) => {
//   const { bookingId, seatToCancel } = req.body;

//   if (!bookingId || !seatToCancel?._id) {
//     return res
//       .status(400)
//       .json({ message: "Booking ID and seat are required." });
//   }

//   try {
//     const booking = await BookingModel.findById(bookingId);
//     if (!booking)
//       return res.status(404).json({ message: "Booking not found." });

//     const event = await EventModel.findById(booking.eventId);
//     if (!event) return res.status(404).json({ message: "Event not found." });

//     // Check if seat exists in booking
//     const seatExists = booking.seats.some(
//       (seat) => seat._id.toString() === seatToCancel._id
//     );
//     if (!seatExists)
//       return res.status(400).json({ message: "Seat not found in booking." });

//     // Remove seat from booking
//     booking.seats = booking.seats.filter(
//       (seat) => seat._id.toString() !== seatToCancel._id
//     );

//     // Remove seat from event
//     event.seats = event.seats.filter(
//       (seat) =>
//         !(
//           seat.section === seatToCancel.section &&
//           seat.row === seatToCancel.row &&
//           seat.seatNumber === seatToCancel.seatNumber
//         )
//     );
//     event.soldTickets = event.soldTickets.filter(
//       (seat) =>
//         !(
//           seat.section === seatToCancel.section &&
//           seat.row === seatToCancel.row &&
//           seat.seatNumber === seatToCancel.seatNumber
//         )
//     );
//     event.ticketSold -= 1;
//     event.ticketsAvailable += 1;

//     // Partial refund if paymentIntentId exists
//     if (booking.paymentIntentId) {
//       const perSeatAmount = booking.totalAmount / (booking.seats.length + 1); // +1 for removed seat
//       const refund = await stripe.refunds.create({
//         payment_intent: booking.paymentIntentId,
//         amount: Math.round(perSeatAmount * 100),
//       });

//       if (refund.status !== "succeeded") {
//         return res.status(400).json({ message: "Refund failed. Try again." });
//       }

//       booking.totalAmount -= perSeatAmount;
//     }

//     // Update OrderModel
//     const order = await OrderModel.findOne({ bookingId });

//     if (order) {
//       const seatIndex = order.seats.findIndex(
//         (seat) =>
//           seat.section === seatToCancel.section &&
//           seat.row === seatToCancel.row &&
//           seat.seatNumber === seatToCancel.seatNumber
//       );

//       const seatPrice = order.seats[seatIndex]?.price || 0;

//       // Remove seat from order
//       order.seats.splice(seatIndex, 1);
//       order.totalAmount -= seatPrice;
//       order.quantity -= 1;

//       // If no seats left, hide the order
//       if (order.seats.length === 0) {
//         order.isUserVisible = false;
//       }

//       await order.save();
//     }

//     // If no seats left in booking, mark as cancelled
//     if (booking.seats.length === 0) {
//       booking.status = "cancelled";
//       booking.isTicketAvailable = false;
//       booking.isUserVisible = false;
//     }

//     await Promise.all([booking.save(), event.save()]);

//     return res.status(200).json({
//       success: true,
//       message:
//         "Seat cancelled successfully" +
//         (booking.status === "cancelled" ? " & booking closed." : "."),
//     });
//   } catch (err) {
//     console.error("Cancel Seat Error:", err);
//     return res.status(500).json({
//       message: "Internal server error.",
//       error: err.message,
//     });
//   }
// };

// based on ordermodel -2
// const cancelBooking = async (req, res) => {
//   try {
//     const { orderId, seatToCancel } = req.body;

//     if (!orderId || !seatToCancel) {
//       return res.status(400).json({
//         message: "Order ID and seat to cancel are required.",
//       });
//     }

//     const { section, row, seatNumber } = seatToCancel;

//     // Step 1: Find the order
//     const order = await OrderModel.findById(orderId);
//     if (!order) {
//       return res.status(404).json({
//         message: "Order not found.",
//       });
//     }

//     // Step 2: Find index of the seat to remove
//     const seatIndex = order.seats.findIndex(
//       (seat) =>
//         seat.section === section &&
//         seat.row === row &&
//         seat.seatNumber === seatNumber
//     );

//     if (seatIndex === -1) {
//       return res.status(404).json({
//         message: "Seat not found or already removed.",
//       });
//     }

//     // Step 3: Remove the seat from the array
//     order.seats.splice(seatIndex, 1);

//     // Step 4: Update quantity and totalAmount (optional, if required)
//     order.quantity = order.seats.length;
//     // order.totalAmount = order.quantity * singleSeatPrice; // Optional

//     // Step 5: Save the updated order
//     await order.save();

//     return res.status(200).json({
//       message: "Seat cancelled successfully.",
//       updatedOrder: order,
//     });
//   } catch (error) {
//     console.error("Cancel Seat Error:", error);
//     return res.status(500).json({
//       message: "Internal server error.",
//       error: error.message,
//     });
//   }
// };

// based on order model and minus price after cancel single seat
const cancelBooking = async (req, res) => {
  try {
    const { orderId, seatToCancel } = req.body;

    if (!orderId || !seatToCancel) {
      return res.status(400).json({
        message: "Order ID and seat to cancel are required.",
      });
    }

    const { section, row, seatNumber, price } = seatToCancel;

    if (typeof price !== "number") {
      return res.status(400).json({
        message: "Seat price must be provided for cancellation.",
      });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Find seat
    const seatIndex = order.seats.findIndex(
      (seat) =>
        seat.section === section &&
        seat.row === row &&
        seat.seatNumber === seatNumber
    );

    if (seatIndex === -1) {
      return res
        .status(404)
        .json({ message: "Seat not found or already removed." });
    }

    // Remove the seat
    order.seats.splice(seatIndex, 1);

    // Refund via Stripe
    if (!order.paymentIntentId) {
      return res
        .status(400)
        .json({ message: "No payment intent found for refund." });
    }

    const refund = await stripe.refunds.create({
      payment_intent: order.paymentIntentId,
      amount: price * 100, // Stripe takes amount in cents
    });

    // Update totalAmount and quantity
    order.totalAmount = Math.max(0, order.totalAmount - price);
    order.quantity = order.seats.length;

    await order.save();

    return res.status(200).json({
      message: "Seat cancelled and refund initiated.",
      refund,
      updatedOrder: order,
    });
  } catch (error) {
    console.error("Cancel Seat Error:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
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

// function to refund for admin
// const refundBooking = async (req, res) => {
//   const { orderId } = req.params;

//   try {
//     const order = await OrderModel.findById(orderId);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     if (order.paymentStatus === "refunded") {
//       return res.status(400).json({
//         success: false,
//         message: "Order already refunded",
//       });
//     }

//     if (!order.paymentIntentId) {
//       return res.status(400).json({
//         success: false,
//         message: "No paymentIntentId found for this booking",
//       });
//     }

//     // Create refund
//     const refund = await stripe.refunds.create({
//       payment_intent: order.paymentIntentId,
//     });

//     // Optionally update booking status
//     order.paymentStatus = "refunded";
//     order.status = "cancelled";
//     await order.save();

//     res.status(200).json({
//       success: true,
//       message: "Refund successful",
//       refundDetails: refund,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Refund failed",
//       error: error.message,
//     });
//   }
// };

const refundAndCancel = async (req, res) => {
  try {
    const { orderId, seatToCancel } = req.body;

    if (!orderId || !seatToCancel) {
      return res.status(400).json({
        message: "Order ID and seat to cancel are required.",
      });
    }

    const { section, row, seatNumber, price } = seatToCancel;

    if (typeof price !== "number") {
      return res.status(400).json({
        message: "Seat price must be provided for cancellation.",
      });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Find seat in order
    const seatIndex = order.seats.findIndex(
      (seat) =>
        seat.section === section &&
        seat.row === row &&
        seat.seatNumber === seatNumber
    );

    if (seatIndex === -1) {
      return res
        .status(404)
        .json({ message: "Seat not found or already removed." });
    }

    // Refund that seat's amount
    if (!order.paymentIntentId) {
      return res
        .status(400)
        .json({ message: "No payment intent found for refund." });
    }

    const refund = await stripe.refunds.create({
      payment_intent: order.paymentIntentId,
      amount: Math.floor(price * 100), // Stripe uses cents
    });

    // Remove seat from order
    order.seats.splice(seatIndex, 1);
    order.totalAmount = Math.max(0, order.totalAmount - price);
    order.quantity = order.seats.length;
    await order.save();

    // Remove seat from event.seats & event.soldTickets
    const event = await EventModel.findById(order.eventId);
    if (event) {
      event.seats = event.seats.filter(
        (s) =>
          !(
            s.section === section &&
            s.row === row &&
            s.seatNumber === seatNumber
          )
      );
      event.soldTickets = event.soldTickets.filter(
        (s) =>
          !(
            s.section === section &&
            s.row === row &&
            s.seatNumber === seatNumber
          )
      );
      event.ticketSold -= 1;
      event.ticketsAvailable += 1;
      await event.save();
    }

    return res.status(200).json({
      message: "Seat cancelled and refund successful.",
      refund,
      updatedOrder: order,
    });
  } catch (error) {
    console.error("Cancel Seat Error:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export {
  cancelBooking,
  confirmPayment,
  createPayment,
  getCancelledOrders,
  refundAndCancel,
};
