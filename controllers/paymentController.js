import Stripe from "stripe";
import OrderModel from "../models/orderModel.js";
import TicketModel from "../models/ticketModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// function for payment
const createTicketPayment = async (req, res) => {
  try {
    const { ticketId, quantity, userId } = req.body;

    if (!ticketId || !quantity) {
      return res.status(400).json({
        success: false,
        error: "Please provide Ticket ID and Quantity",
      });
    }

    const ticket = await TicketModel.findById(ticketId);
    if (!ticket)
      return res.status(404).json({
        success: false,
        error: "Ticket not found",
      });

    const totalAmount = Number(ticket.price) * Number(quantity);

    // Step: 1. Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "usd",
      payment_method_types: ["card"],
    });

    // Step: 2. Save order in DB (status = pending)
    const order = new OrderModel({
      userId,
      ticketId,
      quantity,
      totalAmount,
      stripePaymentId: paymentIntent.id,
      paymentStatus: "pending",
    });
    await order.save();

    // Step: 3. Send clientSecret back to frontend
    res.status(200).json({
      success: true,
      message: "Payment intent created successfully",
      clientSecret: paymentIntent.client_secret,
      orderId: order._id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      messsage: "Internal server error",
      error: error.message,
    });
  }
};

// function to confirm payment and update order status
const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Order ID is required",
      });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Check status from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      order.stripePaymentId
    );

    if (paymentIntent.status === "succeeded") {
      order.paymentStatus = "paid";
      await order.save();
      return res.status(200).json({
        success: true,
        message: "Payment confirmed successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "Payment not completed yet",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Normal payment function for testing purpose
// const createPayment = async (req, res) => {
//   try {
//     const { amount, ticketId, userId } = req.body;
//     if (!amount) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide amount",
//       });
//     }
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: amount,
//       currency: "usd",
//       payment_method_types: ["card"],
//     });
//     return res.status(200).json({
//       clientSecret: paymentIntent.client_secret,
//       success: true,
//       message: "Payment intent created successfully",
//     });
//   } catch (error) {
//     console.log("Error in paymentcontroller :", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

export { confirmPayment, createTicketPayment };
