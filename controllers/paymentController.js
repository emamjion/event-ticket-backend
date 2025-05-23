import Stripe from "stripe";
import BookingModel from "../models/booking.model.js";
import EventModel from "../models/eventModel.js";
import OrderModel from "../models/orderModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Payment: create Stripe payment intent and order

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
//       sellerId: event.sellerId, // assuming your Event model has sellerId
//       eventId: booking.eventId,
//       seats: booking.seats,
//       quantity,
//       totalAmount: booking.totalAmount,
//       paymentStatus: "pending",
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
//     res
//       .status(500)
//       .json({
//         message: "Internal Server Error",
//         error: error.message || error,
//       });
//   }
// };

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

    const existingOrder = await OrderModel.findOne({ bookingId });
    if (existingOrder) {
      return res.status(400).json({
        message: "Payment already initiated for this booking.",
        orderId: existingOrder._id,
        paymentIntentId: existingOrder.paymentIntentId,
      });
    }

    const event = await EventModel.findById(booking.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const quantity = booking.seats?.length || 1;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount * 100),
      currency: "usd",
      metadata: {
        bookingId: booking._id.toString(),
        buyerId: booking.buyerId.toString(),
        eventId: booking.eventId.toString(),
      },
    });

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

// first phase of Confirm Payment: verify payment with Stripe and update order and event
// const confirmPayment = async (req, res) => {
//   const { orderId } = req.body;

//   if (!orderId) {
//     return res.status(400).json({ message: "orderId is required." });
//   }

//   try {
//     const order = await OrderModel.findById(orderId);
//     if (!order) {
//       return res.status(404).json({ message: "Order not found." });
//     }

//     if (order.paymentStatus === "success") {
//       return res
//         .status(400)
//         .json({ message: "Payment already confirmed for this order." });
//     }

//     // Retrieve payment intent status from Stripe
//     const paymentIntent = await stripe.paymentIntents.retrieve(
//       order.paymentIntentId
//     );

//     console.log(paymentIntent.status);

//     if (paymentIntent.status !== "succeeded") {
//       order.paymentStatus = "failed";
//       await order.save();
//       return res
//         .status(400)
//         .json({ success: false, message: "Payment not successful." });
//     }

//     // Payment success: update order and related models
//     order.paymentStatus = "success";
//     await order.save();

//     await BookingModel.findByIdAndUpdate(order.bookingId, {
//       status: "success",
//       isPaid: true,
//       paymentIntentId: order.paymentIntentId,
//     });

//     const event = await EventModel.findById(order.eventId);
//     if (!event) {
//       return res.status(404).json({ message: "Event not found." });
//     }

//     // Remove booked seats from event.seats
//     const remainingSeats = event.seats.filter((seat) => {
//       return !order.seats.some(
//         (bookedSeat) =>
//           bookedSeat.section === seat.section &&
//           bookedSeat.row === seat.row &&
//           bookedSeat.seatNumber === seat.seatNumber
//       );
//     });

//     const ticketsSoldCount = order.seats.length;

//     event.seats = remainingSeats;
//     event.ticketSold += ticketsSoldCount;

//     await event.save();

//     res
//       .status(200)
//       .json({ success: true, message: "Payment confirmed, seats booked." });
//   } catch (error) {
//     console.error("Confirm Payment error:", error);
//     res.status(500).json({ message: "Internal Server Error", error });
//   }
// };

// second phase of confirm payment
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

    const paymentIntent = await stripe.paymentIntents.retrieve(
      order.paymentIntentId
    );

    if (paymentIntent.status !== "succeeded") {
      order.paymentStatus = "failed";
      await order.save();
      return res.status(400).json({
        success: false,
        message: "Payment not successful.",
      });
    }

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

    const remainingSeats = event.seats.filter((seat) => {
      return !order.seats.some(
        (bookedSeat) =>
          bookedSeat.section === seat.section &&
          bookedSeat.row === seat.row &&
          bookedSeat.seatNumber === seat.seatNumber
      );
    });

    event.seats = remainingSeats;
    event.ticketSold += order.seats.length;

    await event.save();

    res.status(200).json({
      success: true,
      message: "Payment confirmed, seats booked.",
    });
  } catch (error) {
    console.error("Confirm Payment error:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// third phase of confirm payment
// const confirmPayment = async (req, res) => {
//   const { orderId } = req.body;

//   if (!orderId) {
//     return res.status(400).json({ message: "orderId is required." });
//   }

//   try {
//     const order = await OrderModel.findById(orderId);
//     if (!order) {
//       return res.status(404).json({ message: "Order not found." });
//     }

//     if (order.paymentStatus === "success") {
//       return res
//         .status(400)
//         .json({ message: "Payment already confirmed for this order." });
//     }

//     // Stripe থেকে paymentIntent retrieve করা
//     const paymentIntent = await stripe.paymentIntents.retrieve(
//       order.paymentIntentId
//     );

//     // যদি payment না হয় তাহলে failed হিসেবে সেভ হবে
//     if (paymentIntent.status !== "succeeded") {
//       order.paymentStatus = "failed";
//       await order.save();
//       return res
//         .status(400)
//         .json({ success: false, message: "Payment not successful." });
//     }

//     // Payment সফল হয়েছে
//     order.paymentStatus = "success";
//     await order.save();

//     // Booking Update
//     await BookingModel.findByIdAndUpdate(order.bookingId, {
//       status: "success",
//       isPaid: true,
//       paymentIntentId: order.paymentIntentId,
//     });

//     // Event Update
//     const event = await EventModel.findById(order.eventId);
//     if (!event) {
//       return res.status(404).json({ message: "Event not found." });
//     }

//     // বুকড সিটগুলো event.seats থেকে বাদ দেওয়া
//     const updatedSeats = event.seats.filter((seat) => {
//       return !order.seats.some(
//         (bookedSeat) =>
//           bookedSeat.section === seat.section &&
//           bookedSeat.row === seat.row &&
//           bookedSeat.seatNumber === seat.seatNumber
//       );
//     });

//     // soldTickets এ বুকড সিটগুলো যোগ করা
//     const updatedSoldTickets = [...event.soldTickets, ...order.seats];

//     // ticketSold কাউন্ট বাড়ানো
//     const ticketsSoldCount = order.seats.length;

//     // Event save
//     event.seats = updatedSeats;
//     event.soldTickets = updatedSoldTickets;
//     event.ticketSold += ticketsSoldCount;
//     await event.save();

//     res.status(200).json({
//       success: true,
//       message: "Payment confirmed, seats booked.",
//     });
//   } catch (error) {
//     console.error("Confirm Payment error:", error);
//     res
//       .status(500)
//       .json({ message: "Internal Server Error", error: error.message });
//   }
// };

export { confirmPayment, createPayment };
