import BookingModel from "../models/booking.model.js";
import EventModel from "../models/eventModel.js";
import SellerModel from "../models/sellerModel.js";

// helper function
const getSellerId = async (user) => {
  if (user.role === "seller") {
    const seller = await SellerModel.findOne({ userId: user.id });
    if (!seller) throw new Error("Seller not found");
    return seller._id;
  } else if (user.role === "admin") {
    return user.id;
  } else {
    throw new Error("Unauthorized");
  }
};

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
const cancelReservedBooking = async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ message: "Booking ID is required." });
  }

  try {
    const user = req.user;
    const sellerId = await getSellerId(user);

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.buyerId.toString() !== sellerId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to cancel this booking." });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled." });
    }

    if (booking.isPaid) {
      return res.status(400).json({
        message: "Paid booking can't be cancelled from here. Use refund route.",
      });
    }

    const event = await EventModel.findById(booking.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    booking.seats.forEach((seat) => {
      event.seats = event.seats.filter(
        (s) =>
          !(
            s.section === seat.section &&
            s.row === seat.row &&
            s.seatNumber === seat.seatNumber
          )
      );

      // Just in case, also remove from soldTickets if added mistakenly
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
    booking.isPaid = false;

    await Promise.all([booking.save(), event.save()]);

    res.status(200).json({
      success: true,
      message: "Reserved booking cancelled successfully.",
    });
  } catch (err) {
    console.error("Cancel Reserved Booking Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Seller reserves seats (without payment)
// const reserveSeatsBySeller = async (req, res) => {
//   const { eventId, sellerId, seats } = req.body;

//   if (!eventId || !sellerId || !Array.isArray(seats) || seats.length === 0) {
//     return res.status(400).json({ message: "Missing or invalid fields." });
//   }

//   try {
//     const event = await EventModel.findById(eventId);
//     if (!event) return res.status(404).json({ message: "Event not found." });

//     const unavailableSeats = seats.filter((seat) =>
//       event.seats.some(
//         (s) =>
//           s.section === seat.section &&
//           s.row === seat.row &&
//           s.seatNumber === seat.seatNumber
//       )
//     );

//     if (unavailableSeats.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Some seats are already booked or reserved.",
//         unavailableSeats,
//       });
//     }

//     const reserveBooking = new BookingModel({
//       eventId,
//       buyerId: sellerId,
//       seats,
//       totalAmount: 0,
//       isPaid: false,
//       status: "reserved",
//     });

//     await reserveBooking.save();

//     event.seats.push(...seats);
//     event.ticketSold += seats.length;
//     event.ticketsAvailable -= seats.length;

//     await event.save();

//     res.status(200).json({
//       success: true,
//       message: "Seats successfully reserved by seller.",
//       bookingId: reserveBooking._id,
//       data: reserveBooking,
//     });
//   } catch (error) {
//     console.error("Seller seat reserve error:", error);
//     res.status(500).json({ message: "Internal Server Error", error });
//   }
// };

const reserveSeatsByStaff = async (req, res) => {
  const { eventId, seats } = req.body;

  if (!eventId || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ message: "Missing or invalid fields." });
  }

  try {
    const user = req.user;
    const sellerId = await getSellerId(user); // 🟢 use helper to get seller/admin ID

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
      isTicketAvailable: true,
    });

    await reserveBooking.save();

    event.seats.push(...seats);
    event.ticketSold += seats.length;
    event.ticketsAvailable -= seats.length;

    await event.save();

    res.status(200).json({
      success: true,
      message: `Seats reserved successfully.`,
      bookingId: reserveBooking._id,
      data: reserveBooking,
    });
  } catch (error) {
    console.error("Staff seat reserve error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Get all booked seats for a specific event
const getBookedSeats = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Fetch all bookings (paid + reserved) for this event
    const bookings = await BookingModel.find({ eventId });

    // Create a combined seat list with status
    const seatMap = [];

    bookings.forEach((booking) => {
      booking.seats.forEach((seat) => {
        seatMap.push({
          ...seat.toObject(),
          status: booking.status, // 'booked', 'reserved', 'cancelled'
          isPaid: booking.isPaid,
        });
      });
    });

    res.status(200).json({
      success: true,
      message: "Seats fetched successfully",
      totalSeats: seatMap.length,
      seats: seatMap,
    });
  } catch (error) {
    console.error("Get booked seats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export {
  bookSeats,
  cancelReservedBooking,
  getBookedSeats,
  getBookingsByBuyer,
  reserveSeatsByStaff,
};
