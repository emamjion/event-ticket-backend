/* previous code 
import mongoose from "mongoose";
import ScanLogModel from "../models/scanLog.model.js";

const getTodayStats = async (req, res) => {
  try {
    const { moderatorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(moderatorId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid moderatorId" });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await ScanLogModel.find({
      moderatorId,
      scannedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const totalScanned = logs.length;
    const validTickets = logs.filter((l) => l.status === "valid").length;
    const alreadyUsed = logs.filter((l) => l.status === "used").length;
    const invalidTickets = logs.filter((l) => l.status === "invalid").length;

    res.status(200).json({
      success: true,
      message: "Today's stats fetched successfully",
      stats: {
        totalScanned,
        validTickets,
        alreadyUsed,
        invalidTickets,
      },
    });
  } catch (error) {
    console.error("Stats Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching stats",
      error: error.message,
    });
  }
};

const getRecentScans = async (req, res) => {
  try {
    const { moderatorId } = req.params;

    const recentLogs = await ScanLogModel.find({ moderatorId })
      .populate("orderId", "eventId buyerId")
      .sort({ scannedAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      message: "Recent scans fetched successfully",
      recentScans: recentLogs,
    });
  } catch (error) {
    console.error("🕓 Recent Scans Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching recent scans",
      error: error.message,
    });
  }
};

export { getRecentScans, getTodayStats };
---------------------------------------------------------- */

import mongoose from "mongoose";
import { TicketScanRecord } from "../models/ticketScanRecord.model.js";

const getTodayStats = async (req, res) => {
  try {
    const { moderatorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(moderatorId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid moderatorId" });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // ✅ Use scannedBy if that's where the data is stored
    const logs = await TicketScanRecord.find({
      scannedBy: new mongoose.Types.ObjectId(moderatorId),
      scannedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const totalScanned = logs.length;
    const validTickets = logs.filter((l) => l.status === "valid").length;
    const alreadyUsed = logs.filter((l) => l.status === "used").length;
    const invalidTickets = logs.filter((l) => l.status === "invalid").length;

    res.status(200).json({
      success: true,
      message: "Today's stats fetched successfully",
      stats: {
        totalScanned,
        validTickets,
        alreadyUsed,
        invalidTickets,
      },
    });
  } catch (error) {
    console.error("📊 Stats Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching today's stats",
      error: error.message,
    });
  }
};

const getRecentScans = async (req, res) => {
  try {
    const { moderatorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(moderatorId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid moderatorId" });
    }

    const recentLogs = await TicketScanRecord.find({
      scannedBy: new mongoose.Types.ObjectId(moderatorId),
    })
      .populate({
        path: "orderId",
        select: "eventId buyerId",
        populate: [
          { path: "eventId", select: "title date location" },
          { path: "buyerId", select: "name email phone" },
        ],
      })
      .sort({ scannedAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      message: "Recent scans fetched successfully",
      recentScans: recentLogs,
    });
  } catch (error) {
    console.error("🕓 Recent Scans Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching recent scans",
      error: error.message,
    });
  }
};

export { getRecentScans, getTodayStats };
