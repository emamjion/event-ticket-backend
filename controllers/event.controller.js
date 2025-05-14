import EventModel from "../models/eventModel.js";
import SellerModel from "../models/sellerModel.js";

// function to create a new event
const createEvent = async (req, res) => {
  try {
    // const sellerId = req.user.id;
    const userId = req.user.id;
    const seller = await SellerModel.findOne({ userId });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }
    const sellerId = seller._id;
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
      image,
      price,
      isPublished: false,
      ticketsAvailable,
      sellerId,
    });

    await newEvent.save();

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export { createEvent };
