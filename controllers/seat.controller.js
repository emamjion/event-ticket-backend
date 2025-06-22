import SeatModel from "../models/seat.model.js";

// Add multiple seats for an event
const addSeats = async (req, res) => {
  const { eventId, seats } = req.body;

  if (!eventId || !seats || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ success: false, message: "Invalid input" });
  }

  try {
    // Add eventId to each seat object
    const seatsWithEventId = seats.map((seat) => ({
      ...seat,
      eventId,
    }));

    // Insert all seats in DB
    const createdSeats = await SeatModel.insertMany(seatsWithEventId);

    res.status(201).json({
      success: true,
      message: "Seats added successfully",
      seats: createdSeats,
    });
  } catch (error) {
    console.error("Add seats error:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// Get seats by eventId
const getSeatsByEvent = async (req, res) => {
  const { eventId } = req.params;

  if (!eventId) {
    return res
      .status(400)
      .json({ success: false, message: "Event ID required" });
  }

  try {
    const seats = await SeatModel.find({ eventId });

    res.status(200).json({
      success: true,
      message: "Seats fetched successfully",
      totalSeats: seats.length,
      seats,
    });
  } catch (error) {
    console.error("Get seats error:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

export { addSeats, getSeatsByEvent };
