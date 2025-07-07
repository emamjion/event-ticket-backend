import transporter from "../config/nodeMailer.js";
import OrderModel from "../models/orderModel.js";
import { generateInvoicePDF } from "../utils/generateInvoicePDF.js";
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
      return res
        .status(400)
        .json({ success: false, message: "Ticket code is required" });
    }

    const order = await OrderModel.findOne({ ticketCode });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid ticket" });
    }

    if (order.isUsed) {
      return res.status(200).json({
        success: false,
        message: "Ticket already used",
        used: true,
        ticketCode: order.ticketCode,
        eventId: order.eventId,
        buyerId: order.buyerId,
      });
    }

    // Mark ticket as used
    order.isUsed = true;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Ticket verified successfully",
      used: false,
      ticketCode: order.ticketCode,
      eventId: order.eventId,
      buyerId: order.buyerId,
    });
  } catch (err) {
    console.error("Error verifying ticket:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// with attach pdf
const sendOrderEmail = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "orderId is required." });
    }

    // Fetch order and populate event, buyer, and seller details
    const order = await OrderModel.findById(orderId).populate(
      "eventId buyerId sellerId"
    );
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    // Extract buyer and event details
    const buyerName = order?.buyerId?.name || "Customer";
    const buyerEmail = order?.buyerId?.email;
    const event = order?.eventId;

    const customer = {
      name: order?.buyerId?.name || "Customer",
      email: order?.buyerId?.email || "unknown@example.com",
      phone: order?.buyerId?.phone || "N/A", // If phone is optional
    };

    if (!buyerEmail || !event) {
      return res
        .status(400)
        .json({ success: false, message: "Missing email or event data." });
    }

    // 🧾 Generate both PDFs for buyer and seller
    const ticketPdfBuffer = await generateOrderTicketPDF(order, event);
    const invoicePdfBuffer = await generateInvoicePDF(order, event, customer); // <- your utility

    // ==========================
    // Send Email to Buyer
    // ==========================
    const mailOptionsForBuyer = {
      from: process.env.SENDER_EMAIL,
      to: buyerEmail,
      subject: `Your Ticket & Invoice for ${event.title}`,
      html: `
        <div style="font-family:sans-serif;">
          <h2>Hello ${buyerName},</h2>
          <p>Thank you for booking your ticket with us!</p>
          <p><strong>Event:</strong> ${event.title}</p>
          <p><strong>Seats:</strong> ${order.seats.join(", ")}</p>
          <p><strong>Ticket Code:</strong> ${order.ticketCode}</p>
          <p><strong>Total Paid:</strong> $${order.totalAmount}</p>
          <p>Please find both your <strong>ticket</strong> and <strong>invoice</strong> PDFs attached below.</p>
          <br/>
          <p>Enjoy the event! 🎉</p>
        </div>
      `,
      attachments: [
        {
          filename: `ticket-${order._id}.pdf`,
          content: ticketPdfBuffer,
        },
        {
          filename: `invoice-${order._id}.pdf`,
          content: invoicePdfBuffer,
        },
      ],
    };

    // Send email to the buyer
    await transporter.sendMail(mailOptionsForBuyer);

    // ==========================
    // Send Email to Seller (Organizer)
    // ==========================
    const sellerName = order?.sellerId?.name || "Organizer";
    const sellerEmail = order?.sellerId?.email;
    const sellerPhone = order?.sellerId?.phone || "N/A";
    console.log("Seller email: ", sellerEmail);

    // Check if seller's email exists
    if (sellerEmail) {
      const sellerMailOptions = {
        from: process.env.SENDER_EMAIL,
        to: sellerEmail,
        subject: `Invoice for ${event.title} booking by ${buyerName}`,
        html: `
          <div style="font-family:sans-serif;">
            <h2>Hello ${sellerName},</h2>
            <p>A new booking has been made for your event <strong>${
              event.title
            }</strong>.</p>
            <p><strong>Buyer:</strong> ${buyerName} (${buyerEmail})</p>
            <p><strong>Seats:</strong> ${order.seats.join(", ")}</p>
            <p><strong>Total Paid:</strong> $${order.totalAmount}</p>
            <p>Please find the invoice PDF attached below for your records.</p>
            <br/>
            <p>Best Regards,</p>
            <p>Event Management Platform</p>
          </div>
        `,
        attachments: [
          {
            filename: `invoice-${order._id}.pdf`,
            content: invoicePdfBuffer,
          },
        ],
      };

      // Send email to the seller (organizer)
      await transporter.sendMail(sellerMailOptions);
    }

    // Respond with success
    res.status(200).json({
      success: true,
      message: "Email sent successfully with ticket and invoice.",
    });
  } catch (error) {
    console.error("Send Order Email Error:", error);
    res.status(500).json({ success: false, message: "Failed to send email." });
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

export { sendOrderEmail, verifyTicket };
