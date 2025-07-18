import { v2 as cloudinary } from "cloudinary";
import transporter from "../config/nodeMailer.js";
import OrderModel from "../models/orderModel.js";
import TicketModel from "../models/ticket.model.js";
import { generateInvoicePDF } from "../utils/generateInvoicePDF.js";
import generateOrderTicketPDF from "../utils/generateOrderTicketPDF.js";

// helper function
const bufferToDataUri = (fileFormat, buffer) => {
  return `data:application/${fileFormat};base64,${buffer.toString("base64")}`;
};


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
// const sendOrderEmail = async (req, res) => {
//   try {
//     const { orderId } = req.body;

//     if (!orderId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "orderId is required." });
//     }

//     // Fetch order and populate event, buyer, and seller details
//     const order = await OrderModel.findById(orderId).populate(
//       "eventId buyerId sellerId"
//     );
//     if (!order) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Order not found." });
//     }

//     // Extract buyer and event details
//     const buyerName = order?.buyerId?.name || "Customer";
//     const buyerEmail = order?.buyerId?.email;
//     const event = order?.eventId;

//     const customer = {
//       name: order?.buyerId?.name || "Customer",
//       email: order?.buyerId?.email || "unknown@example.com",
//       phone: order?.buyerId?.phone || "N/A",
//     };

//     if (!buyerEmail || !event) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing email or event data." });
//     }

//     // 🧾 Generate both PDFs for buyer and seller
//     const ticketPdfBuffer = await generateOrderTicketPDF(order, event);
//     const invoicePdfBuffer = await generateInvoicePDF(order, event, customer);

//     // ==========================
//     // Send Email to Buyer
//     // ==========================
//     const formattedSeats = order.seats
//       .map((seat, index) => {
//         return `
//     <tr>
//       <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${
//         index + 1
//       }</td>
//       <td style="padding: 8px; border: 1px solid #ddd;">${seat.section}</td>
//       <td style="padding: 8px; border: 1px solid #ddd;">${seat.row}</td>
//       <td style="padding: 8px; border: 1px solid #ddd;">${seat.seatNumber}</td>
//       <td style="padding: 8px; border: 1px solid #ddd;">$${seat.price}</td>
//     </tr>
//   `;
//       })
//       .join("");

//     const mailOptionsForBuyer = {
//       from: process.env.SENDER_EMAIL,
//       to: buyerEmail,
//       subject: `🎫 Your Ticket & Invoice for ${event.title}`,
//       html: `
//     <div style="font-family: Arial, sans-serif; background-color: #f8f8f8; padding: 30px;">
//       <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
//         <h2 style="text-align: center; color: #cc3333;">Events N Tickets</h2>

//         <p style="font-size: 16px;">Hello <strong>${buyerName}</strong>,</p>
//         <p style="font-size: 15px;">🎉 Thank you for booking your ticket with <strong>Events N Tickets</strong>!</p>

//         <div style="margin: 25px 0;">
//           <p style="font-size: 15px;"><strong>🎤 Event:</strong> ${
//             event.title
//           }</p>
//           <p style="font-size: 15px;"><strong>🎟️ Ticket Code:</strong> <span style="color: #cc3333;">${
//             order.ticketCode
//           }</span></p>
//           <p style="font-size: 15px;"><strong>💵 Total Paid:</strong> <span style="color: #28a745;">$${
//             order.totalAmount
//           }</span></p>
//         </div>

//         <h3 style="margin-top: 30px; font-size: 16px; color: #444;">🪑 Seat Details:</h3>
//         <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 10px;">
//           <thead>
//             <tr style="background-color: #f0f0f0;">
//               <th style="padding: 8px; border: 1px solid #ddd;">#</th>
//               <th style="padding: 8px; border: 1px solid #ddd;">Section</th>
//               <th style="padding: 8px; border: 1px solid #ddd;">Row</th>
//               <th style="padding: 8px; border: 1px solid #ddd;">Seat Number</th>
//               <th style="padding: 8px; border: 1px solid #ddd;">Price</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${formattedSeats}
//           </tbody>
//         </table>

//         <p style="font-size: 15px; margin-top: 25px;">Your <strong>ticket</strong> and <strong>invoice</strong> PDFs are attached below. Please bring them to the event (printed or on your phone).</p>

//         <div style="margin: 30px 0; text-align: center;">
//           <p style="font-size: 15px;">Enjoy the event! 🎊</p>
//         </div>

//         <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
//         <p style="text-align: center; font-size: 13px; color: #999;">&copy; ${new Date().getFullYear()} Events N Tickets. All rights reserved.</p>
//       </div>
//     </div>
//   `,
//       attachments: [
//         {
//           filename: `ticket-${order._id}.pdf`,
//           content: ticketPdfBuffer,
//         },
//         {
//           filename: `invoice-${order._id}.pdf`,
//           content: invoicePdfBuffer,
//         },
//       ],
//     };

//     // Send email to the buyer
//     await transporter.sendMail(mailOptionsForBuyer);

//     // ==========================
//     // Send Email to Seller (Organizer)
//     // ==========================
//     const sellerName = order?.sellerId?.name || "Organizer";
//     const sellerEmail = order?.sellerId?.email;
//     const sellerPhone = order?.sellerId?.contactNumber || "N/A";

//     // Check if seller's email exists
//     if (sellerEmail) {
//       const sellerMailOptions = {
//         from: process.env.SENDER_EMAIL,
//         to: sellerEmail,
//         subject: `Invoice for ${event.title} booking by ${buyerName}`,
//         html: `
//           <div style="font-family:sans-serif;">
//             <h2>Hello ${sellerName},</h2>
//             <p>A new booking has been made for your event <strong>${
//               event.title
//             }</strong>.</p>
//             <p><strong>Buyer:</strong> ${buyerName} (${buyerEmail})</p>
//             <p><strong>Seats:</strong> ${order.seats.join(", ")}</p>
//             <p><strong>Total Paid:</strong> $${order.totalAmount}</p>
//             <p>Please find the invoice PDF attached below for your records.</p>
//             <br/>
//             <p>Best Regards,</p>
//             <p>Event Management Platform</p>
//           </div>
//         `,
//         attachments: [
//           {
//             filename: `invoice-${order._id}.pdf`,
//             content: invoicePdfBuffer,
//           },
//         ],
//       };
//       await transporter.sendMail(sellerMailOptions);
//     }

//     // ==========================
//     // Send Email to Admin
//     // ==========================
//     // const adminName = order?.adminId?.name || "Admin";
//     // const adminEmail = order?.adminId?.email;

//     const adminEmails = [
//       process.env.ADMIN_EMAIL,
//       process.env.ADMIN_SECOND_EMAIL,
//     ].filter(Boolean);

//     if (adminEmails.length > 0) {
//       const adminMailOptions = {
//         from: process.env.SENDER_EMAIL,
//         to: adminEmails,
//         subject: `📥 Booking Notification | ${event.title}`,
//         html: `
//       <div style="font-family: sans-serif;">
//         <h2>Hello Admin,</h2>
//         <p>A new booking has been made for the event <strong>${
//           event.title
//         }</strong>.</p>
//         <p><strong>Buyer:</strong> ${buyerName} (${buyerEmail})</p>
//         <p><strong>Organizer:</strong> ${sellerName} (${
//           sellerEmail || "N/A"
//         })</p>
//         <p><strong>Seats:</strong> ${order.seats
//           .map((s) => `${s.section}-${s.row}-${s.seatNumber}`)
//           .join(", ")}</p>
//         <p><strong>Total Paid:</strong> $${order.totalAmount}</p>
//         <p>Attached is the invoice PDF for your record.</p>
//         <br/>
//         <p>Regards,</p>
//         <p>Events N Tickets</p>
//       </div>
//     `,
//         attachments: [
//           {
//             filename: `invoice-${order._id}.pdf`,
//             content: invoicePdfBuffer,
//           },
//         ],
//       };

//       await transporter.sendMail(adminMailOptions);
//     }

//     // Respond with success
//     res.status(200).json({
//       success: true,
//       message: "Email sent successfully with ticket and invoice.",
//     });
//   } catch (error) {
//     console.error("Send Order Email Error:", error);
//     res.status(500).json({ success: false, message: "Failed to send email." });
//   }
// };

const sendOrderEmail = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "orderId is required." });
    }

    // Fetch order and populate details
    const order = await OrderModel.findById(orderId).populate(
      "eventId buyerId sellerId"
    );

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    const event = order.eventId;
    const buyer = order.buyerId;
    const seller = order.sellerId;

    if (!buyer?.email || !event) {
      return res
        .status(400)
        .json({ success: false, message: "Missing email or event data." });
    }

    // Generate multiple ticket PDFs for each seat
    const ticketAttachments = await Promise.all(
      order.seats.map(async (seat, index) => {
        const singleSeatOrder = {
          ...order.toObject(),
          seats: [seat],
          ticketCode:
            order.ticketCodes?.[index] ||
            order.ticketCode ||
            `TICKET${index + 1}`,
        };

        const buffer = await generateOrderTicketPDF(singleSeatOrder, event);
        return {
          filename: `ticket-${index + 1}.pdf`,
          content: buffer,
        };
      })
    );

    // Invoice PDF
    const customer = {
      name: buyer.name || "Customer",
      email: buyer.email || "unknown@example.com",
      phone: buyer.phone || "N/A",
    };
    const invoiceBuffer = await generateInvoicePDF(order, event, customer);

    // Build table rows for seat info (FIXED: proper price per seat)
    const formattedSeats = order.seats
      .map((seat, i) => {
        const price =
          seat.price ??
          order.ticketPrices?.[i] ??
          order.totalAmount / order.seats.length;

        return `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${
              i + 1
            }</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              seat.section
            }</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${seat.row}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              seat.seatNumber
            }</td>
            <td style="padding: 8px; border: 1px solid #ddd;">$${parseFloat(
              price
            ).toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");

    // ========================
    // Email to Buyer
    // ========================
    const buyerMailOptions = {
      from: process.env.SENDER_EMAIL,
      to: buyer.email,
      subject: `🎫 Your Tickets & Invoice for ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f8f8f8; padding: 30px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <h2 style="text-align: center; color: #cc3333;">Events N Tickets</h2>
            <p>Hello <strong>${buyer.name || "Customer"}</strong>,</p>
            <p>🎉 Thank you for booking your ticket with <strong>Events N Tickets</strong>!</p>
            <p><strong>🎤 Event:</strong> ${event.title}</p>
            <p><strong>💵 Total Paid:</strong> <span style="color: #28a745;">$${parseFloat(
              order.totalAmount
            ).toFixed(2)}</span></p>

            <h3>🪑 Seat Details:</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 10px;">
              <thead>
                <tr style="background-color: #f0f0f0;">
                  <th>#</th><th>Section</th><th>Row</th><th>Seat Number</th><th>Price</th>
                </tr>
              </thead>
              <tbody>${formattedSeats}</tbody>
            </table>

            <p>Your <strong>tickets</strong> and <strong>invoice</strong> PDFs are attached below. Please bring them to the event.</p>
            <p style="text-align: center;">Enjoy the event! 🎊</p>
            <hr style="margin: 30px 0;" />
            <p style="text-align: center; font-size: 13px; color: #999;">&copy; ${new Date().getFullYear()} Events N Tickets</p>
          </div>
        </div>
      `,
      attachments: [
        ...ticketAttachments,
        {
          filename: `invoice-${order._id}.pdf`,
          content: invoiceBuffer,
        },
      ],
    };

    await transporter.sendMail(buyerMailOptions);

    // ========================
    // Email to Seller
    // ========================
    if (seller?.email) {
      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: seller.email,
        subject: `📥 Booking for ${event.title}`,
        html: `
          <div style="font-family: sans-serif;">
            <h2>Hello ${seller.name || "Organizer"},</h2>
            <p>A booking has been made for your event: <strong>${
              event.title
            }</strong></p>
            <p><strong>Buyer:</strong> ${buyer.name} (${buyer.email})</p>
            <p><strong>Seats:</strong> ${order.seats
              .map((s) => `${s.section}-${s.row}-${s.seatNumber}`)
              .join(", ")}</p>
            <p><strong>Total Paid:</strong> $${parseFloat(
              order.totalAmount
            ).toFixed(2)}</p>
            <p>Invoice is attached for your record.</p>
          </div>
        `,
        attachments: [
          {
            filename: `invoice-${order._id}.pdf`,
            content: invoiceBuffer,
          },
        ],
      });
    }

    // ========================
    // Email to Admins
    // ========================
    const adminEmails = [
      process.env.ADMIN_EMAIL,
      process.env.ADMIN_SECOND_EMAIL,
    ].filter(Boolean);

    if (adminEmails.length > 0) {
      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: adminEmails,
        subject: `📥 Booking Notification | ${event.title}`,
        html: `
          <div style="font-family: sans-serif;">
            <h2>Hello Admin,</h2>
            <p>New booking received for event: <strong>${
              event.title
            }</strong></p>
            <p><strong>Buyer:</strong> ${buyer.name} (${buyer.email})</p>
            <p><strong>Organizer:</strong> ${seller?.name || "N/A"} (${
          seller?.email || "N/A"
        })</p>
            <p><strong>Total Paid:</strong> $${parseFloat(
              order.totalAmount
            ).toFixed(2)}</p>
            <p>Invoice attached.</p>
          </div>
        `,
        attachments: [
          {
            filename: `invoice-${order._id}.pdf`,
            content: invoiceBuffer,
          },
        ],
      });
    }

    // ========================
    // Final Response
    // ========================
    res.status(200).json({
      success: true,
      message: "Emails sent successfully with ticket and invoice.",
    });
  } catch (err) {
    console.error("SendOrderEmail Error:", err);
    res.status(500).json({ success: false, message: "Failed to send email." });
  }
};

const uploadTicket = async (req, res) => {
  try {
    const { orderId, buyerId, eventId } = req.body;

    if (!orderId || !buyerId || !eventId) {
      return res.status(400).json({
        success: false,
        message: "Order ID, Buyer ID, and Event ID are required.",
      });
    }

    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one PDF file is required.",
      });
    }

    const uploadedTickets = [];

    for (const file of files) {
      const fileFormat = file.originalname.split(".").pop();
      const fileDataUri = bufferToDataUri(fileFormat, file.buffer);

      const uploadResult = await cloudinary.uploader.upload(fileDataUri, {
        resource_type: "raw",
        folder: "event-tickets",
        public_id: `ticket_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}`,
      });

      const ticket = new TicketModel({
        orderId,
        buyerId,
        eventId,
        pdfUrl: uploadResult.secure_url,
      });

      await ticket.save();

      uploadedTickets.push({
        ticketId: ticket._id,
        pdfUrl: ticket.pdfUrl,
      });
    }

    res.status(201).json({
      success: true,
      message: "Tickets uploaded and saved successfully!",
      uploadedTickets,
    });
  } catch (error) {
    console.error("Error in uploadTicket:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// function to send email
const sendEmailToBuyer = async (req, res) => {
  try {
    const { ticketId } = req.body;

    if (!ticketId) {
      return res
        .status(400)
        .json({ success: false, message: "ticketId is required." });
    }

    const ticket = await TicketModel.findById(ticketId)
      .populate("buyerId")
      .populate("eventId")
      .populate("orderId");

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found." });
    }

    if (!ticket.pdf?.data) {
      return res
        .status(400)
        .json({ success: false, message: "PDF not found in ticket." });
    }

    const buyer = ticket.buyerId;
    const event = ticket.eventId;
    const order = ticket.orderId;

    const customer = {
      name: order?.buyerId?.name || "Customer",
      email: order?.buyerId?.email || "unknown@example.com",
      phone: order?.buyerId?.phone || "N/A",
    };

    if (!buyer?.email || !event) {
      return res
        .status(400)
        .json({ success: false, message: "Missing buyer or event info." });
    }

    const invoicePdfBuffer = await generateInvoicePDF(order, event, customer);

    const buyerName = buyer.name || "Customer";
    const buyerEmail = buyer.email;

    const formattedSeats = order.seats
      .map((seat, index) => {
        return `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${
        index + 1
      }</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${seat.section}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${seat.row}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${seat.seatNumber}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">$${seat.price}</td>
    </tr>
  `;
      })
      .join("");

    const mailOptionsForBuyer = {
      from: process.env.SENDER_EMAIL,
      to: buyerEmail,
      subject: `🎫 Your Ticket & Invoice for ${event.title}`,
      html: `
    <div style="font-family: Arial, sans-serif; background-color: #f8f8f8; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h2 style="text-align: center; color: #cc3333;">Events N Tickets</h2>

        <p style="font-size: 16px;">Hello <strong>${buyerName}</strong>,</p>
        <p style="font-size: 15px;">🎉 Thank you for booking your ticket with <strong>Events N Tickets</strong>!</p>

        <div style="margin: 25px 0;">
          <p style="font-size: 15px;"><strong>🎤 Event:</strong> ${
            event.title
          }</p>
          <p style="font-size: 15px;"><strong>🎟️ Ticket Code:</strong> <span style="color: #cc3333;">${
            order.ticketCode
          }</span></p>
          <p style="font-size: 15px;"><strong>💵 Total Paid:</strong> <span style="color: #28a745;">$${
            order.totalAmount
          }</span></p>
        </div>

        <h3 style="margin-top: 30px; font-size: 16px; color: #444;">🪑 Seat Details:</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="padding: 8px; border: 1px solid #ddd;">#</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Section</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Row</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Seat Number</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${formattedSeats}
          </tbody>
        </table>

        <p style="font-size: 15px; margin-top: 25px;">Your <strong>ticket</strong> and <strong>invoice</strong> PDFs are attached below. Please bring them to the event (printed or on your phone).</p>

        <div style="margin: 30px 0; text-align: center;">
          <p style="font-size: 15px;">Enjoy the event! 🎊</p>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
        <p style="text-align: center; font-size: 13px; color: #999;">&copy; ${new Date().getFullYear()} Events N Tickets. All rights reserved.</p>
      </div>
    </div>
  `,
      attachments: [
        {
          filename: `ticket-${ticket._id}.pdf`,
          content: ticket.pdf.data,
          contentType: "application/pdf",
        },
        {
          filename: `invoice-${order._id}.pdf`,
          content: invoicePdfBuffer,
        },
      ],
    };

    await transporter.sendMail(mailOptionsForBuyer);

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Send Order Email Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send email.",
      error: error.message,
    });
  }
};

export { sendEmailToBuyer, sendOrderEmail, uploadTicket, verifyTicket };
