import BookingModel from "../models/booking.model.js";
import EventModel from "../models/eventModel.js";
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
// const getSeatsByEvent = async (req, res) => {
//   const { eventId } = req.params;

//   if (!eventId) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Event ID required" });
//   }

//   try {
//     const seats = await EventModel.find({ eventId });

//     res.status(200).json({
//       success: true,
//       message: "Seats fetched successfully",
//       totalSeats: seats.length,
//       seats,
//     });
//   } catch (error) {
//     console.error("Get seats error:", error);
//     res.status(500).json({ success: false, message: "Server error", error });
//   }
// };

const getSeatsByEvent = async (req, res) => {
  const { eventId } = req.params;

  if (!eventId) {
    return res.status(400).json({
      success: false,
      message: "Event ID is required",
    });
  }

  try {
    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const bookings = await BookingModel.find({
      eventId,
      status: { $in: ["reserved", "success"] },
    });

    // 📦 Flatten seat data
    const bookedSeats = [];

    bookings.forEach((booking) => {
      booking.seats.forEach((seat) => {
        bookedSeats.push({
          section: seat.section,
          row: seat.row,
          seatNumber: seat.seatNumber,
          price: seat.price,
          status: booking.status,
          isPaid: booking.isPaid,
          bookingId: booking._id,
        });
      });
    });

    res.status(200).json({
      success: true,
      message: "Seats fetched successfully",
      totalSeats: bookedSeats.length,
      seats: bookedSeats,
    });
  } catch (error) {
    console.error("Error fetching booked seats:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching seats",
      error: error.message,
    });
  }
};

// const getSeatsByEvent = async (req, res) => {
//   const { eventId } = req.params;

//   if (!eventId) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Event ID required" });
//   }

//   try {
//     const event = await EventModel.findById(eventId);
//     if (!event) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Event not found" });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Booked seats fetched successfully",
//       totalSeats: event.seats.length,
//       seats: event.seats,
//     });
//   } catch (error) {
//     console.error("Get booked seats error:", error);
//     res.status(500).json({ success: false, message: "Server error", error });
//   }
// };

export { addSeats, getSeatsByEvent };
