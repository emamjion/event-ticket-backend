import OrderModel from "../models/orderModel.js";
import { TicketScanRecord } from "../models/ticketScanRecord.model.js";
import UserModel from "../models/userModel.js";

/*
const scanTicket = async (req, res) => {
  try {
    const { ticketCode, moderatorId } = req.body;

    if (!ticketCode || !moderatorId) {
      return res.status(400).json({
        success: false,
        message: "ticketCode and moderatorId are required.",
      });
    }

    const moderator = await UserModel.findOne({
      _id: moderatorId,
      role: "moderator",
    });
    if (!moderator) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only moderators can scan tickets.",
      });
    }

    const order = await OrderModel.findOne({ ticketCode })
      .populate("buyerId", "name email contactNumber")
      .populate("eventId", "title name date time location");

    if (!order) {
      return res.status(404).json({
        success: false,
        status: "invalid",
        message: "Invalid ticket code.",
      });
    }

    // count how many times this ticketCode was scanned before
    const totalScans = await TicketScanRecord.countDocuments({ ticketCode });

    if (totalScans >= order.quantity) {
      return res.status(200).json({
        success: true,
        status: "used",
        message: "All tickets under this code have been used.",
        totalSeats: order.quantity,
        usedScans: totalScans,
      });
    }

    // create new scan record
    await TicketScanRecord.create({
      ticketCode,
      scannedBy: moderatorId,
    });

    res.status(200).json({
      success: true,
      status: "valid",
      message: "Ticket verified successfully - entry granted.",
      verificationResult: {
        status: "valid",
        buyer: {
          name: order.buyerId?.name,
          email: order.buyerId?.email,
        },
        event: {
          title: order.eventId?.title || order.eventId?.name,
          date: order.eventId?.date,
          time: order.eventId?.time,
          location: order.eventId?.location,
        },
        scanTime: new Date(),
        scannedBy: moderator.name,
        ticketCode,
        remainingSeats: order.quantity - totalScans - 1,
      },
    });
  } catch (error) {
    console.error("🎫 Ticket Scan Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while scanning ticket.",
      error: error.message,
    });
  }
};
*/

/* second
const scanTicket = async (req, res) => {
  try {
    const { ticketCode, moderatorId } = req.body;

    if (!ticketCode || !moderatorId) {
      return res.status(400).json({
        success: false,
        message: "ticketCode and moderatorId are required.",
      });
    }

    const moderator = await UserModel.findOne({
      _id: moderatorId,
      role: "moderator",
    });
    if (!moderator) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only moderators can scan tickets.",
      });
    }

    const order = await OrderModel.findOne({ ticketCode })
      .populate("buyerId", "name email contactNumber")
      .populate("eventId", "title name date time location");

    if (!order) {
      return res.status(404).json({
        success: false,
        status: "invalid",
        message: "Invalid ticket code.",
      });
    }

    // count how many times this ticketCode was scanned before
    const totalScans = await TicketScanRecord.countDocuments({ ticketCode });

    // ✅ Check if already fully used
    if (totalScans >= order.quantity) {
      return res.status(200).json({
        success: true,
        status: "used",
        message: "All tickets under this code have been used.",
        totalSeats: order.quantity,
        usedScans: totalScans,
        remainingSeats: 0,
      });
    }

    // ✅ create new scan record
    await TicketScanRecord.create({
      ticketCode,
      scannedBy: moderatorId,
    });

    // ✅ get updated count (after adding this scan)
    const updatedTotalScans = totalScans + 1;
    const remainingSeats = order.quantity - updatedTotalScans;

    // ✅ response
    res.status(200).json({
      success: true,
      status: "valid",
      message: "Ticket verified successfully - entry granted.",
      verificationResult: {
        status: "valid",
        buyer: {
          name: order.buyerId?.name,
          email: order.buyerId?.email,
          contactNumber: order.buyerId?.contactNumber,
        },
        event: {
          title: order.eventId?.title || order.eventId?.name,
          date: order.eventId?.date,
          time: order.eventId?.time,
          location: order.eventId?.location,
        },
        scanTime: new Date(),
        scannedBy: moderator.name,
        ticketCode,
        totalSeats: order.quantity,
        usedScans: updatedTotalScans,
        remainingSeats: remainingSeats < 0 ? 0 : remainingSeats,
      },
    });
  } catch (error) {
    console.error("🎫 Ticket Scan Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while scanning ticket.",
      error: error.message,
    });
  }
};
*/

// third
const scanTicket = async (req, res) => {
  try {
    const { ticketCode, moderatorId } = req.body;

    if (!ticketCode || !moderatorId) {
      return res.status(400).json({
        success: false,
        message: "ticketCode and moderatorId are required.",
      });
    }

    // ✅ check moderator access
    const moderator = await UserModel.findOne({
      _id: moderatorId,
      role: "moderator",
    });
    if (!moderator) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only moderators can scan tickets.",
      });
    }

    // ✅ find ticket order
    const order = await OrderModel.findOne({ ticketCode })
      .populate("buyerId", "name email contactNumber")
      .populate("eventId", "title name date time location");

    // ❌ invalid ticket
    if (!order) {
      await TicketScanRecord.create({
        ticketCode,
        scannedBy: moderatorId,
        status: "invalid",
      });

      return res.status(404).json({
        success: false,
        status: "invalid",
        message: "Invalid ticket code.",
      });
    }

    // ✅ how many times this ticket scanned
    const totalScans = await TicketScanRecord.countDocuments({ ticketCode });

    // 🟠 check if already fully used
    if (totalScans >= order.quantity) {
      await TicketScanRecord.create({
        ticketCode,
        scannedBy: moderatorId,
        status: "used",
      });

      return res.status(200).json({
        success: true,
        status: "used",
        message: "All tickets under this code have been used.",
        totalSeats: order.quantity,
        usedScans: totalScans,
        remainingSeats: 0,
      });
    }

    // ✅ create valid scan record
    await TicketScanRecord.create({
      ticketCode,
      scannedBy: moderatorId,
      status: "valid",
    });

    // ✅ update counts
    const updatedTotalScans = totalScans + 1;
    const remainingSeats = order.quantity - updatedTotalScans;

    // ✅ response
    res.status(200).json({
      success: true,
      status: "valid",
      message: "Ticket verified successfully - entry granted.",
      verificationResult: {
        status: "valid",
        buyer: {
          name: order.buyerId?.name,
          email: order.buyerId?.email,
          contactNumber: order.buyerId?.contactNumber,
        },
        event: {
          title: order.eventId?.title || order.eventId?.name,
          date: order.eventId?.date,
          time: order.eventId?.time,
          location: order.eventId?.location,
        },
        scanTime: new Date(),
        scannedBy: moderator.name,
        ticketCode,
        totalSeats: order.quantity,
        usedScans: updatedTotalScans,
        remainingSeats: remainingSeats < 0 ? 0 : remainingSeats,
      },
    });
  } catch (error) {
    console.error("🎫 Ticket Scan Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while scanning ticket.",
      error: error.message,
    });
  }
};

export { scanTicket };
