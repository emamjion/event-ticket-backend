import transporter from "../config/nodeMailer.js";
import OrderModel from "../models/orderModel.js";
import generateOrderTicketPDF from "../utils/generateOrderTicketPDF.js";

// const verifyTicket = async (req, res) => {
//   const { orderId } = req.params;

//   try {
//     const order = await OrderModel.findById(orderId);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Invalid ticket. No order found.",
//       });
//     }

//     if (order.ticketStatus === "used") {
//       return res.status(400).json({
//         success: false,
//         message: "Ticket already used.",
//       });
//     }

//     // First time use – mark as used
//     order.ticketStatus = "used";
//     await order.save();

//     res.status(200).json({
//       success: true,
//       message: "Ticket is valid. Entry granted.",
//       orderDetails: order,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error verifying ticket.",
//       error: error.message,
//     });
//   }
// };

// controllers/ticketController.js

const verifyTicket = async (req, res) => {
  try {
    const { ticketCode } = req.body;

    if (!ticketCode) {
      return res.status(400).json({ message: "Ticket code is required" });
    }

    const order = await OrderModel.findOne({ ticketCode });

    if (!order) {
      return res.status(404).json({ message: "Invalid ticket code" });
    }

    if (order.isUsed) {
      return res.status(200).json({
        message: "Ticket already used",
        used: true,
        eventId: order.eventId,
        buyerId: order.buyerId,
        scannedAt: order.scannedAt,
      });
    }

    order.isUsed = true;
    order.scannedAt = new Date();
    await order.save();

    return res.status(200).json({
      message: "Ticket is valid and marked as used",
      used: false,
      eventId: order.eventId,
      buyerId: order.buyerId,
      scannedAt: order.scannedAt,
    });
  } catch (error) {
    console.error("Error verifying ticket:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// With simple email
// const sendOrderEmail = async (req, res) => {
//   try {
//     const { orderId } = req.body;

//     if (!orderId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "orderId is required." });
//     }

//     const order = await OrderModel.findById(orderId).populate(
//       "eventId buyerId"
//     );
//     if (!order) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Order not found." });
//     }

//     const buyerName = order?.buyerId?.name || "Customer";
//     const buyerEmail = order?.buyerId?.email;

//     if (!buyerEmail) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Buyer email not found." });
//     }

//     const event = order.eventId;
//     const eventName = event?.name || "Event";

//     // PDF jodi pathate chao:
//     // const pdfBuffer = await generateTicketPDF(order);

//     const mailOptions = {
//       from: process.env.SENDER_EMAIL,
//       to: buyerEmail,
//       subject: `🎟 Your Ticket for ${eventName}`,
//       html: `
//         <div style="font-family:sans-serif;">
//           <h2>Hello ${buyerName},</h2>
//           <p>Thank you for booking your ticket with us!</p>
//           <p><strong>Event:</strong> ${eventName}</p>
//           <p><strong>Seats:</strong> ${order.seats.join(", ")}</p>
//           <p><strong>Ticket Code:</strong> ${order.ticketCode}</p>
//           <p><strong>Total Paid:</strong> $${order.totalAmount}</p>
//           <br/>
//           <p>Show this ticket at the venue gate.</p>
//           <p>Enjoy the event! 🎉</p>
//         </div>
//       `,
//       // attachments: [
//       //   {
//       //     filename: `ticket-${order._id}.pdf`,
//       //     content: pdfBuffer,
//       //   },
//       // ],
//     };

//     await transporter.sendMail(mailOptions);

//     res.status(200).json({
//       success: true,
//       message: "Email sent successfully.",
//     });
//   } catch (error) {
//     console.error("Send Order Email Error:", error);
//     res.status(500).json({ success: false, message: "Failed to send email." });
//   }
// };

// with attach pdf
const sendOrderEmail = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "orderId is required." });
    }

    const order = await OrderModel.findById(orderId).populate(
      "eventId buyerId"
    );
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    const buyerName = order?.buyerId?.name || "Customer";
    const buyerEmail = order?.buyerId?.email;
    const event = order?.eventId;

    if (!buyerEmail || !event) {
      return res
        .status(400)
        .json({ success: false, message: "Missing email or event data." });
    }

    const pdfBuffer = await generateOrderTicketPDF(order, event);

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: buyerEmail,
      subject: `Your Ticket for ${event.title}`,
      html: `
        <div style="font-family:sans-serif;">
          <h2>Hello ${buyerName},</h2>
          <p>Thank you for booking your ticket with us!</p>
          <p><strong>Event:</strong> ${event.title}</p>
          <p><strong>Seats:</strong> ${order.seats.join(", ")}</p>
          <p><strong>Ticket Code:</strong> ${order.ticketCode}</p>
          <p><strong>Total Paid:</strong> $${order.totalAmount}</p>
          <p>Please find your ticket PDF attached below.</p>
          <br/>
          <p>Enjoy the event! 🎉</p>
        </div>
      `,
      attachments: [
        {
          filename: `ticket-${order._id}.pdf`,
          content: pdfBuffer,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Email sent successfully.",
    });
  } catch (error) {
    console.error("Send Order Email Error:", error);
    res.status(500).json({ success: false, message: "Failed to send email." });
  }
};

export { sendOrderEmail, verifyTicket };
