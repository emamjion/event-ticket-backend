import OrderModel from "../models/orderModel.js";
import ScanLogModel from "../models/scanLog.model.js";
import UserModel from "../models/userModel.js";

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
      .populate("buyerId", "name email")
      .populate("eventId", "title name date time location");

    if (!order) {
      await ScanLogModel.create({
        ticketCode,
        moderatorId,
        status: "invalid",
      });

      return res.status(404).json({
        success: false,
        status: "invalid",
        message: "Invalid ticket code. No matching order found.",
        verificationResult: {
          status: "invalid",
          message: "No order found for this ticket code.",
          scannedBy: moderator.name,
          ticketCode,
        },
      });
    }

    if (order.isUsed) {
      await ScanLogModel.create({
        ticketCode,
        moderatorId,
        orderId: order._id,
        status: "used",
      });

      return res.status(200).json({
        success: true,
        status: "used",
        message: "This ticket has already been used.",
        verificationResult: {
          status: "used",
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
          scanTime: order.scannedAt,
          purchaseDate: order.createdAt,
          scannedBy: moderator.name,
          ticketCode: order.ticketCode,
        },
      });
    }

    order.isUsed = true;
    order.scannedAt = new Date();
    order.scannedBy = moderatorId;
    await order.save();

    await ScanLogModel.create({
      ticketCode,
      moderatorId,
      orderId: order._id,
      status: "valid",
    });

    return res.status(200).json({
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
        scanTime: order.scannedAt,
        purchaseDate: order.createdAt,
        scannedBy: moderator.name,
        ticketCode: order.ticketCode,
      },
    });
  } catch (error) {
    console.error("🎫 Ticket Scan Error:", error);
    res.status(500).json({
      success: false,
      status: "error",
      message: "Server error while scanning ticket.",
      error: error.message,
    });
  }
};

const getScannedTicketsByModerator = async (req, res) => {
  try {
    const moderatorId = req.params.moderatorId;

    const moderator = await UserModel.findOne({
      _id: moderatorId,
      role: "moderator",
    });

    if (!moderator) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only moderators can view scanned tickets.",
      });
    }

    const scannedTickets = await OrderModel.find({
      isUsed: true,
      scannedBy: moderatorId,
    })
      .populate("eventId", "name date time location")
      .populate("buyerId", "name email")
      .sort({ scannedAt: -1 });

    res.status(200).json({
      success: true,
      count: scannedTickets.length,
      message: "Scanned tickets fetched successfully",
      tickets: scannedTickets.map((t) => ({
        ticketCode: t.ticketCode,
        eventName: t.eventId?.name,
        eventDate: t.eventId?.date,
        location: t.eventId?.location,
        buyerName: t.buyerId?.name,
        buyerEmail: t.buyerId?.email,
        scannedAt: t.scannedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching scanned tickets:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching scanned tickets.",
      error: error.message,
    });
  }
};

export { getScannedTicketsByModerator, scanTicket };
