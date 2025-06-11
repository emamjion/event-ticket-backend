import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import EventModel from "../models/eventModel.js";
import SellerModel from "../models/sellerModel.js";

// Helper to get sellerId based on role
const getSellerId = async (user) => {
  if (user.role === "seller") {
    const seller = await SellerModel.findOne({ userId: user.id });
    if (!seller) throw new Error("Seller not found");
    return seller._id;
  } else if (user.role === "admin") {
    return user.id; // Use admin's userId directly
  } else {
    throw new Error("Unauthorized");
  }
};

// Create Event
const createEvent = async (req, res) => {
  try {
    const sellerId = await getSellerId(req.user);

    const {
      title,
      description,
      date,
      time,
      location,
      contactNumber,
      email,
      priceRange,
    } = req.body;

    const parsedPriceRange =
      typeof priceRange === "string" ? JSON.parse(priceRange) : priceRange;

    const image = req.file;
    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const result = await cloudinary.uploader.upload(image.path);
    const imageUrl = result.secure_url;

    const existingEvent = await EventModel.findOne({
      title,
      date,
      sellerId,
    });

    if (existingEvent) {
      return res.status(400).json({
        success: false,
        message: "You have already created this event.",
      });
    }

    const newEvent = new EventModel({
      title,
      description,
      date,
      time,
      location,
      image: imageUrl,
      contactNumber,
      email,
      priceRange: parsedPriceRange,
      isPublished: false,
      ticketSold: 0,
      sellerId,
    });

    await newEvent.save();

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Seller/Admin Events
const getSellerEvents = async (req, res) => {
  try {
    const sellerId = await getSellerId(req.user);

    const events = await EventModel.find({ sellerId });
    res.status(200).json({ success: true, totalEvents: events.length, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const user = req.user;
    const eventId = req.params.id;

    if (!req.body && !req.file) {
      return res.status(400).json({
        success: false,
        message: "No data provided to update",
      });
    }

    let event;
    if (user.role === "admin") {
      event = await EventModel.findById(eventId);
    } else if (user.role === "seller") {
      const sellerId = await getSellerId(user);
      event = await EventModel.findOne({ _id: eventId, sellerId });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found or unauthorized",
      });
    }

    // ✅ Upload image if provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      req.body.image = result.secure_url;

      // Remove temp file
      fs.unlinkSync(req.file.path);
    }

    // ✅ Parse priceRange if it's a string
    if (req.body.priceRange && typeof req.body.priceRange === "string") {
      try {
        req.body.priceRange = JSON.parse(req.body.priceRange);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid priceRange format. Must be a valid JSON object.",
        });
      }
    }

    // ✅ Merge updates
    Object.assign(event, req.body);
    await event.save();

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    console.error("Update Event Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Event - seller
// const deleteEvent = async (req, res) => {
//   try {
//     const sellerId = await getSellerId(req.user);
//     const eventId = req.params.id;

//     const event = await EventModel.findOneAndDelete({
//       _id: eventId,
//       sellerId,
//     });

//     if (!event) {
//       return res.status(404).json({
//         success: false,
//         message: "Event not found or unauthorized",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Event deleted successfully",
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// delete event - seller and admin
const deleteEvent = async (req, res) => {
  try {
    const user = req.user;
    const eventId = req.params.id;

    let event;

    if (user.role === "admin") {
      event = await EventModel.findById(eventId);
    } else if (user.role === "seller") {
      const sellerId = await getSellerId(user);
      event = await EventModel.findOne({ _id: eventId, sellerId });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found or unauthorized",
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { createEvent, deleteEvent, getSellerEvents, updateEvent };
