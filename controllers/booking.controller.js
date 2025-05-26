import BookingModel from "../models/booking.model.js";
import EventModel from "../models/eventModel.js";

// first phase of booking seat
// const bookSeats = async (req, res) => {
//   const { eventId, buyerId, seats, totalAmount } = req.body;

//   if (!eventId || !buyerId || !seats || seats.length === 0) {
//     return res.status(400).json({ message: "Missing required fields." });
//   }

//   try {
//     const event = await EventModel.findById(eventId);

//     if (!event) {
//       return res.status(404).json({ message: "Event not found." });
//     }

//     // Check if seats already booked or locked
//     const unavailableSeats = seats.filter((requestedSeat) => {
//       return event.seats.some(
//         (bookedSeat) =>
//           bookedSeat.section === requestedSeat.section &&
//           bookedSeat.row === requestedSeat.row &&
//           bookedSeat.seatNumber === requestedSeat.seatNumber
//       );
//     });

//     if (unavailableSeats.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Some seats are already booked or unavailable.",
//         unavailableSeats,
//       });
//     }

//     // Step 01: Save booking with status pending
//     const newBooking = new BookingModel({
//       eventId,
//       buyerId,
//       seats,
//       totalAmount,
//       isPaid: false,
//       status: "pending", // new field
//     });

//     await newBooking.save();

//     return res.status(200).json({
//       success: true,
//       message: "Booking created, waiting for payment.",
//       bookingId: newBooking._id,
//     });
//   } catch (error) {
//     console.error("Booking error:", error);
//     res.status(500).json({ message: "Internal Server Error", error });
//   }
// };

// second phase of booking seat
const bookSeats = async (req, res) => {
  const { eventId, buyerId, seats, totalAmount } = req.body;

  if (!eventId || !buyerId || !seats || seats.length === 0) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const event = await EventModel.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Check if seats already booked
    const unavailableSeats = seats.filter((requestedSeat) => {
      return event.seats.some(
        (bookedSeat) =>
          bookedSeat.section === requestedSeat.section &&
          bookedSeat.row === requestedSeat.row &&
          bookedSeat.seatNumber === requestedSeat.seatNumber
      );
    });

    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some seats are already booked or unavailable.",
        unavailableSeats,
      });
    }

    // Step 01: Save booking with status pending
    const newBooking = new BookingModel({
      eventId,
      buyerId,
      seats,
      totalAmount,
      isPaid: false,
      status: "pending",
    });

    await newBooking.save();

    // ✅ Step 02: Add seats to event's seats array
    event.seats.push(...seats);
    event.soldTickets.push(...seats); // optional
    event.ticketSold += seats.length;
    event.ticketsAvailable -= seats.length;

    await event.save();

    return res.status(200).json({
      success: true,
      message: "Booking created and seats locked. Waiting for payment.",
      bookingId: newBooking._id,
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

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

// cancel booking function
const cancelBooking = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    if (booking.isPaid) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot cancel a paid booking." });
    }

    if (booking.status === "cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "Booking already cancelled." });
    }

    const event = await EventModel.findById(booking.eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found." });
    }

    // Remove the booked seats from event.seats and soldTickets
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

    // Update ticket counts
    event.ticketSold -= booking.seats.length;
    event.ticketsAvailable += booking.seats.length;

    // Update booking status
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

// function to reserve seat by seller
const reserveSeatsBySeller = async (req, res) => {
  const { eventId, sellerId, seats } = req.body;

  if (!eventId || !sellerId || !seats || seats.length === 0) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const event = await EventModel.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Check if any seat is already booked
    const unavailableSeats = seats.filter((requestedSeat) => {
      return event.seats.some(
        (bookedSeat) =>
          bookedSeat.section === requestedSeat.section &&
          bookedSeat.row === requestedSeat.row &&
          bookedSeat.seatNumber === requestedSeat.seatNumber
      );
    });

    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some seats are already booked or reserved.",
        unavailableSeats,
      });
    }

    // Save a booking entry for tracking (optional)
    const reserveBooking = new BookingModel({
      eventId,
      buyerId: sellerId, // or use a new field like reservedBy
      seats,
      totalAmount: 0, // no cost
      isPaid: false,
      status: "reserved",
    });

    await reserveBooking.save();

    // Lock seats in event
    event.seats.push(...seats);
    event.ticketSold += seats.length;
    event.ticketsAvailable -= seats.length;

    await event.save();

    return res.status(200).json({
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

export { bookSeats, cancelBooking, getBookingsByBuyer, reserveSeatsBySeller };
