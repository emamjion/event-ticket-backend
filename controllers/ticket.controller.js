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

const verifyTicket = async (req, res) => {
  const { ticketCode } = req.params;

  try {
    const order = await OrderModel.findOne({ ticketCode });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Invalid ticket. No order found.",
      });
    }

    if (order.ticketStatus === "used") {
      return res.status(400).json({
        success: false,
        message: "Ticket already used.",
      });
    }

    // Mark as used
    order.ticketStatus = "used";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Ticket is valid. Entry granted.",
      orderDetails: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error verifying ticket.",
      error: error.message,
    });
  }
};

export { verifyTicket };
