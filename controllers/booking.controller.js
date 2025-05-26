import BookingModel from "../models/booking.model.js";
import EventModel from "../models/eventModel.js";

// Book seats (Phase 2)
const bookSeats = async (req, res) => {
  const { eventId, buyerId, seats, totalAmount } = req.body;

  if (!eventId || !buyerId || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ message: "Missing or invalid fields." });
  }

  try {
    const event = await EventModel.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found." });

    const unavailableSeats = seats.filter((seat) =>
      event.seats.some(
        (s) =>
          s.section === seat.section &&
          s.row === seat.row &&
          s.seatNumber === seat.seatNumber
      )
    );

    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some seats are already booked or unavailable.",
        unavailableSeats,
      });
    }

    const newBooking = new BookingModel({
      eventId,
      buyerId,
      seats,
      totalAmount,
      isPaid: false,
      status: "pending",
    });

    await newBooking.save();

    event.seats.push(...seats);
    event.soldTickets.push(...seats);
    event.ticketSold += seats.length;
    event.ticketsAvailable -= seats.length;

    await event.save();

    res.status(200).json({
      success: true,
      message: "Booking created and seats locked. Waiting for payment.",
      bookingId: newBooking._id,
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Get all bookings by a buyer
const getBookingsByBuyer = async (req, res) => {
  const { buyerId } = req.params;

  try {
    const bookings = await BookingModel.find({ buyerId }).sort({
      bookingTime: -1,
    });

    res.status(200).json({
      success: true,
      message: "Bookings fetched successfully",
      totalBookings: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not fetch bookings",
      error,
    });
  }
};

// Cancel a booking (only if not paid)
const cancelBooking = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await BookingModel.findById(bookingId);
    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });

    if (booking.isPaid)
      return res
        .status(400)
        .json({ success: false, message: "Cannot cancel a paid booking." });

    if (booking.status === "cancelled")
      return res
        .status(400)
        .json({ success: false, message: "Booking already cancelled." });

    const event = await EventModel.findById(booking.eventId);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found." });

    booking.seats.forEach((seat) => {
      event.seats = event.seats.filter(
        (s) =>
          !(
            s.section === seat.section &&
            s.row === seat.row &&
            s.seatNumber === seat.seatNumber
          )
      );
      event.soldTickets = event.soldTickets.filter(
        (s) =>
          !(
            s.section === seat.section &&
            s.row === seat.row &&
            s.seatNumber === seat.seatNumber
          )
      );
    });

    event.ticketSold -= booking.seats.length;
    event.ticketsAvailable += booking.seats.length;

    booking.status = "cancelled";

    await Promise.all([event.save(), booking.save()]);

    res.status(200).json({
      success: true,
      message: "Booking cancelled and seats unlocked successfully.",
      data: booking,
    });
  } catch (error) {
    console.error("Cancel Booking Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

// Seller reserves seats (without payment)
const reserveSeatsBySeller = async (req, res) => {
  const { eventId, sellerId, seats } = req.body;

  if (!eventId || !sellerId || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ message: "Missing or invalid fields." });
  }

  try {
    const event = await EventModel.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found." });

    const unavailableSeats = seats.filter((seat) =>
      event.seats.some(
        (s) =>
          s.section === seat.section &&
          s.row === seat.row &&
          s.seatNumber === seat.seatNumber
      )
    );

    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some seats are already booked or reserved.",
        unavailableSeats,
      });
    }

    const reserveBooking = new BookingModel({
      eventId,
      buyerId: sellerId,
      seats,
      totalAmount: 0,
      isPaid: false,
      status: "reserved",
    });

    await reserveBooking.save();

    event.seats.push(...seats);
    event.ticketSold += seats.length;
    event.ticketsAvailable -= seats.length;

    await event.save();

    res.status(200).json({
      success: true,
      message: "Seats successfully reserved by seller.",
      bookingId: reserveBooking._id,
      data: reserveBooking,
    });
  } catch (error) {
    console.error("Seller seat reserve error:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Get all booked seats for a specific event
const getBookedSeats = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await EventModel.findById(eventId);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });

    res.status(200).json({
      success: true,
      message: "Booked seats fetched successfully",
      totalBookedSeats: event.seats.length,
      bookedSeats: event.seats,
    });
  } catch (error) {
    console.error("Get booked seats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error,
    });
  }
};

export {
  bookSeats,
  cancelBooking,
  getBookedSeats,
  getBookingsByBuyer,
  reserveSeatsBySeller,
};
