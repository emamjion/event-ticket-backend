import EventModel from "../models/eventModel.js";

// publish ticket
const publishEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const updatedEvent = await EventModel.findByIdAndUpdate(
      id,
      { isPublished },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Event has been ${isPublished ? "published" : "unpublished"}`,
      data: updatedEvent,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update event status",
      error: error.message,
    });
  }
};

// get publish ticket
const getPublishedEvents = async (req, res) => {
  try {
    const events = await EventModel.find({ isPublished: true })
      .sort({
        date: 1,
      })
      .populate("sellerId", "shopName email contactNumber");
    console.log("events: ", events);

    res.status(200).json({
      success: true,
      message: "Published events fetched successfully",
      totalEvents: events.length,
      events: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get published events",
      error: error.message,
    });
  }
};

// get published ticket by Id for details
const getPublishedEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await EventModel.findById(id).populate(
      "sellerId",
      "shopName email contactNumber"
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (!event.isPublished) {
      return res.status(403).json({
        success: false,
        message: "Event is not published yet",
      });
    }

    const availableSeats = event.ticketsAvailable - event.ticketSold;

    res.status(200).json({
      success: true,
      message: "Event details fetched successfully",
      event,
      availableSeats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get event",
      error: error.message,
    });
  }
};

export { getPublishedEventById, getPublishedEvents, publishEvent };
