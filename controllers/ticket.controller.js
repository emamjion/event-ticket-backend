import OrderModel from "../models/orderModel.js";

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

export { verifyTicket };
