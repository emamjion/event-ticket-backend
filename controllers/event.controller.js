import EventModel from "../models/eventModel.js";
import SellerModel from "../models/sellerModel.js";

// Create Event
const createEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findOne({ userId });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    const {
      title,
      description,
      date,
      time,
      location,
      image,
      price,
      ticketsAvailable,
    } = req.body;

    const existingEvent = await EventModel.findOne({
      title,
      date,
      sellerId: seller._id,
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
      image,
      price,
      isPublished: false,
      ticketsAvailable,
      sellerId: seller._id,
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

// Get All Events for a Seller
const getSellerEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findOne({ userId });

    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    const events = await EventModel.find({ sellerId: seller._id });
    res.status(200).json({ success: true, totalEvents: events.length, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Event
const updateEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findOne({ userId });

    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    const eventId = req.params.id;
    const event = await EventModel.findOne({
      _id: eventId,
      sellerId: seller._id,
    });

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found or unauthorized" });
    }

    Object.assign(event, req.body);
    await event.save();

    res
      .status(200)
      .json({ success: true, message: "Event updated successfully", event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Event
const deleteEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findOne({ userId });

    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    const eventId = req.params.id;
    const event = await EventModel.findOneAndDelete({
      _id: eventId,
      sellerId: seller._id,
    });

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found or unauthorized" });
    }

    res
      .status(200)
      .json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { createEvent, deleteEvent, getSellerEvents, updateEvent };
