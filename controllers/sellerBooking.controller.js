import BookingModel from "../models/booking.model.js";
import EventModel from "../models/eventModel.js";

const reserveSeatsForSeller = async (req, res) => {
  const { eventId, seats } = req.body;
  const sellerId = req.user?.id;
  console.log("seller id: ", sellerId);

  // Check if required fields exist
  if (!eventId || !sellerId || !seats || seats.length === 0) {
    return res.status(400).json({ message: "Required fields are missing." });
  }

  try {
    // Find the event by ID
    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    console.log("Seats requested:", seats);
    console.log("Event seats status:");

    event.seats.forEach((s) => {
      console.log(
        `Section: ${s.section}, Row: ${s.row}, SeatNumber: ${s.seatNumber}, Status: ${s.status}`
      );
    });

    console.log("Event seats:", event.seats);

    // Check availability of seats
    const unavailableSeats = seats.filter((seat) => {
      const seatInEvent = event.seats.find(
        (s) =>
          s.section === seat.section &&
          s.row === seat.row &&
          s.seatNumber === Number(seat.seatNumber) // name to number conversion
      );

      // Seat is unavailable if not found or status is not 'available'
      return !seatInEvent || seatInEvent.status !== "available";
    });

    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some seats are already reserved or sold.",
        unavailableSeats,
      });
    }

    // Update seat status to 'reserved'
    seats.forEach((seatToReserve) => {
      const seatInEvent = event.seats.find(
        (s) =>
          s.section === seatToReserve.section &&
          s.row === seatToReserve.row &&
          s.seatNumber === Number(seatToReserve.seatNumber) // name to number conversion
      );
      if (seatInEvent) {
        seatInEvent.status = "reserved";
      }
    });

    // Save updated event
    await event.save();

    // Create booking/reservation for seller
    const reservation = new BookingModel({
      eventId,
      buyerId: sellerId,
      seats,
      totalAmount: 0,
      isPaid: false,
      status: "reserved",
      role: "seller",
    });

    await reservation.save();

    return res.status(200).json({
      success: true,
      message: "Seats reserved successfully.",
      reservationId: reservation._id,
      data: reservation,
    });
  } catch (error) {
    console.error("Reservation error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export { reserveSeatsForSeller };
