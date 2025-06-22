import BookingModel from "../models/booking.model.js";
import EventModel from "../models/eventModel.js";
import OrderModel from "../models/orderModel.js";
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

// without single seat price
// const bookSeats = async (req, res) => {
//   const { eventId, buyerId, seats, totalAmount } = req.body;

//   if (!eventId || !buyerId || !Array.isArray(seats) || seats.length === 0) {
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
//         message: "Some seats are already booked or unavailable.",
//         unavailableSeats,
//       });
//     }

//     const newBooking = new BookingModel({
//       eventId,
//       buyerId,
//       seats,
//       totalAmount,
//       isPaid: false,
//       status: "pending",
//     });

//     await newBooking.save();

//     event.seats.push(...seats);
//     event.soldTickets.push(...seats);
//     event.ticketSold += seats.length;
//     event.ticketsAvailable -= seats.length;

//     await event.save();

//     // Auto cancel booking after 10 minutes if not paid
//     setTimeout(async () => {
//       const stillPending = await BookingModel.findById(newBooking._id);

//       if (stillPending && !stillPending.isPaid) {
//         console.log("⏱️ Auto cancelling unpaid booking: ", newBooking._id);

//         // step:1. Cancel the booking
//         stillPending.status = "cancelled";
//         stillPending.isTicketAvailable = false;
//         stillPending.isUserVisible = false;
//         await stillPending.save();

//         // step:2. Return the seats to the event
//         const originalEvent = await EventModel.findById(eventId);
//         if (originalEvent) {
//           stillPending.seats.forEach((seat) => {
//             originalEvent.seats = originalEvent.seats.filter(
//               (s) =>
//                 !(
//                   s.section === seat.section &&
//                   s.row === seat.row &&
//                   s.seatNumber === seat.seatNumber
//                 )
//             );

//             originalEvent.soldTickets = originalEvent.soldTickets.filter(
//               (s) =>
//                 !(
//                   s.section === seat.section &&
//                   s.row === seat.row &&
//                   s.seatNumber === seat.seatNumber
//                 )
//             );
//           });

//           originalEvent.ticketSold -= stillPending.seats.length;
//           originalEvent.ticketsAvailable += stillPending.seats.length;

//           await originalEvent.save();
//         }

//         // step:3. Hide from order table
//         await OrderModel.findOneAndUpdate(
//           { bookingId: stillPending._id },
//           { isUserVisible: false }
//         );
//       }
//     }, 10 * 60 * 1000); // 10 minutes in milliseconds

//     res.status(200).json({
//       success: true,
//       message: "Booking created and seats locked. Waiting for payment.",
//       bookingId: newBooking._id,
//     });
//   } catch (error) {
//     console.error("Booking error:", error);
//     res.status(500).json({ message: "Internal Server Error", error });
//   }
// };

// with single seat price
const bookSeats = async (req, res) => {
  const { eventId, buyerId, seats } = req.body;

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

    // 🧮 Calculate total amount from seat prices
    const totalAmount = seats.reduce((sum, seat) => sum + seat.price, 0);

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

    // ⏱️ Auto cancel after 10 minutes
    setTimeout(async () => {
      const stillPending = await BookingModel.findById(newBooking._id);

      if (stillPending && !stillPending.isPaid) {
        console.log("⏱️ Auto cancelling unpaid booking: ", newBooking._id);

        stillPending.status = "cancelled";
        stillPending.isTicketAvailable = false;
        stillPending.isUserVisible = false;
        await stillPending.save();

        const originalEvent = await EventModel.findById(eventId);
        if (originalEvent) {
          stillPending.seats.forEach((seat) => {
            originalEvent.seats = originalEvent.seats.filter(
              (s) =>
                !(
                  s.section === seat.section &&
                  s.row === seat.row &&
                  s.seatNumber === seat.seatNumber
                )
            );

            originalEvent.soldTickets = originalEvent.soldTickets.filter(
              (s) =>
                !(
                  s.section === seat.section &&
                  s.row === seat.row &&
                  s.seatNumber === seat.seatNumber
                )
            );
          });

          originalEvent.ticketSold -= stillPending.seats.length;
          originalEvent.ticketsAvailable += stillPending.seats.length;

          await originalEvent.save();
        }

        await OrderModel.findOneAndUpdate(
          { bookingId: stillPending._id },
          { isUserVisible: false }
        );
      }
    }, 10 * 60 * 1000); // 10 minutes

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
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    if (booking.buyerId.toString() !== sellerId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to cancel this booking." });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking already cancelled." });
    }

    if (booking.isPaid) {
      return res.status(400).json({
        message: "Paid booking can't be cancelled here. Please refund instead.",
      });
    }

    const event = await EventModel.findById(booking.eventId);
    if (!event) return res.status(404).json({ message: "Event not found." });

    // Remove seats from event
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

    // Update booking
    booking.status = "cancelled";
    booking.isTicketAvailable = false;
    booking.isUserVisible = false;
    booking.isPaid = false;

    // Save both
    await Promise.all([booking.save(), event.save()]);

    // Optional: Hide from order table if exists
    await OrderModel.findOneAndUpdate(
      { bookingId: booking._id },
      { isUserVisible: false }
    );

    res.status(200).json({
      success: true,
      message: "Reserved booking cancelled successfully and seats released.",
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

  console.log("Request body: ", req.body);

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

// Get all booked/reserved (excluding cancelled) seats for a specific event
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

    // Only fetch bookings that are not cancelled
    const bookings = await BookingModel.find({
      eventId,
      status: { $ne: "cancelled" }, // Exclude cancelled bookings
    });

    const seatMap = [];

    bookings.forEach((booking) => {
      booking.seats.forEach((seat) => {
        seatMap.push({
          ...seat.toObject(),
          status: booking.status, // 'booked' or 'reserved'
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

// check seats availability functionality
const checkSeatsAvailability = async (req, res) => {
  const { eventId, seats } = req.body;

  if (!eventId || !seats || seats.length === 0) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const event = await EventModel.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const unavailableSeats = seats.filter((requestedSeat) => {
      return event.seats.some(
        (bookedSeat) =>
          bookedSeat.section === requestedSeat.section &&
          bookedSeat.row === requestedSeat.row &&
          bookedSeat.seatNumber === requestedSeat.seatNumber
      );
    });

    if (unavailableSeats.length > 0) {
      return res.status(200).json({
        success: false,
        message: "Some seats are already booked or reserved.",
        unavailableSeats,
      });
    }

    return res.status(200).json({
      success: true,
      message: "All seats are available.",
    });
  } catch (error) {
    console.error("Check seats error:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export {
  bookSeats,
  cancelReservedBooking,
  checkSeatsAvailability,
  getBookedSeats,
  getBookingsByBuyer,
  reserveSeatsByStaff,
};
