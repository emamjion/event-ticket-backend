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

// with single seat price
const bookSeats = async (req, res) => {
  const { eventId, buyerId, seats } = req.body;

  if (!eventId || !buyerId || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ message: "Missing or invalid fields." });
  }

  try {
    // Event check
    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Check if seats are already held in pending bookings (not expired)
    const now = new Date();
    const conflictingBookings = await BookingModel.find({
      eventId,
      status: "pending",
      isPaid: false,
      expiryTime: { $gt: now },
      seats: {
        $elemMatch: {
          $or: seats.map(({ section, row, seatNumber }) => ({
            section,
            row,
            seatNumber,
          })),
        },
      },
    });

    const unavailableSeats = [];
    conflictingBookings.forEach((booking) => {
      booking.seats.forEach((bookedSeat) => {
        seats.forEach((requestedSeat) => {
          if (
            bookedSeat.section === requestedSeat.section &&
            bookedSeat.row === requestedSeat.row &&
            bookedSeat.seatNumber === requestedSeat.seatNumber
          ) {
            unavailableSeats.push(requestedSeat);
          }
        });
      });
    });

    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some seats are already booked or unavailable.",
        unavailableSeats,
      });
    }

    // Total amount calculation
    const totalAmount = seats.reduce((sum, seat) => sum + seat.price, 0);
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Create booking
    const newBooking = new BookingModel({
      eventId,
      buyerId,
      seats,
      totalAmount,
      isPaid: false,
      sessionStartTime: new Date(),
      expiryTime,
      status: "pending",
      isUserVisible: false,
    });

    await newBooking.save();

    // Update Event with held seats
    event.seats.push(...seats);
    event.soldTickets.push(...seats);
    event.ticketSold += seats.length;
    event.ticketsAvailable -= seats.length;

    await event.save();

    // Auto cancel unpaid booking after 10 mins
    setTimeout(async () => {
      const stillPending = await BookingModel.findById(newBooking._id);

      if (
        stillPending &&
        !stillPending.isPaid &&
        stillPending.status === "pending"
      ) {
        console.log("Auto cancelling unpaid booking:", newBooking._id);

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

        // Hide from Orders (if exists)
        await OrderModel.findOneAndUpdate(
          { bookingId: stillPending._id },
          { isUserVisible: false }
        );
      }
    }, 10 * 60 * 1000); // 10 mins

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

// function to get booking session time
const getBookingSessionTime = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await BookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      sessionStartTime: booking.sessionStartTime,
    });
  } catch (error) {
    console.error("Error fetching session time:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch session time",
      error: error.message,
    });
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
  const { bookingId, seatsToCancel } = req.body;

  if (
    !bookingId ||
    !Array.isArray(seatsToCancel) ||
    seatsToCancel.length === 0
  ) {
    return res.status(400).json({ message: "Missing or invalid fields." });
  }

  try {
    const user = req.user;

    // Get seller/admin ID
    const sellerId = await getSellerId(user);

    // Find booking
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Authorization: Ensure user owns this booking
    if (booking.buyerId.toString() !== sellerId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized access to this booking." });
    }

    // Filter out seats to cancel
    const remainingSeats = booking.seats.filter(
      (seat) =>
        !seatsToCancel.some(
          (s) =>
            s.section === seat.section &&
            s.row === seat.row &&
            s.seatNumber === seat.seatNumber
        )
    );

    // No seats left? Delete booking
    if (remainingSeats.length === 0) {
      await BookingModel.findByIdAndDelete(bookingId);

      // Update event stats (optional)
      const event = await EventModel.findById(booking.eventId);
      if (event) {
        event.ticketSold -= booking.seats.length;
        event.ticketsAvailable += booking.seats.length;
        await event.save();
      }

      return res.status(200).json({
        success: true,
        message: "All seats cancelled and booking deleted.",
      });
    }

    // Update booking with remaining seats
    const seatsCancelled = booking.seats.length - remainingSeats.length;

    booking.seats = remainingSeats;
    await booking.save();

    // Update event stats
    const event = await EventModel.findById(booking.eventId);
    if (event) {
      event.ticketSold -= seatsCancelled;
      event.ticketsAvailable += seatsCancelled;
      await event.save();
    }

    return res.status(200).json({
      success: true,
      message: "Selected seat(s) cancelled successfully.",
      remainingSeats: booking.seats,
    });
  } catch (error) {
    console.error("Cancel reserved seats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
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

    // Get seller/admin ID
    const sellerId = await getSellerId(user);

    // Find the event
    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Check if any seat is already reserved/booked/pending
    const existingBookings = await BookingModel.find({
      eventId,
      status: { $in: ["pending", "success", "reserved"] },
      seats: {
        $elemMatch: {
          $or: seats.map((seat) => ({
            section: seat.section,
            row: seat.row,
            seatNumber: seat.seatNumber,
          })),
        },
      },
    });

    const unavailableSeats = [];
    existingBookings.forEach((booking) => {
      booking.seats.forEach((bookedSeat) => {
        const conflict = seats.find(
          (seat) =>
            seat.section === bookedSeat.section &&
            seat.row === bookedSeat.row &&
            seat.seatNumber === bookedSeat.seatNumber
        );
        if (conflict) {
          unavailableSeats.push(conflict);
        }
      });
    });

    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some seats are already reserved or booked.",
        unavailableSeats,
      });
    }

    // Create a reserved booking
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

    // Update event stats (optional – can be handled via cron)
    event.ticketSold += seats.length;
    event.ticketsAvailable -= seats.length;
    await event.save();

    return res.status(200).json({
      success: true,
      message: "Seats reserved successfully.",
      bookingId: reserveBooking._id,
      data: reserveBooking,
    });
  } catch (error) {
    console.error("Staff seat reserve error:", error);
    return res
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

    const bookings = await BookingModel.find({
      eventId,
      status: { $in: ["reserved", "pending", "success"] },
    });

    const seatMap = [];

    bookings.forEach((booking) => {
      booking.seats.forEach((seat) => {
        seatMap.push({
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

    console.log("Total seats returned:", seatMap.length);

    res.status(200).json({
      success: true,
      message: "Seats fetched successfully!!!!!!",
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

// function to save optional info
const saveOptionalInfo = async (req, res) => {
  try {
    const { bookingId, recipientEmail, note } = req.body;
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return res.status(400).json({
        success: false,
        message: "Booking not found",
      });
    }

    // update optional fields
    booking.recipientEmail = recipientEmail;
    booking.note = note;
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Info Saved Successfully",
    });
  } catch (error) {
    console.log("Error in save optional error: ", error.message);
    res.status(500).json({
      success: false,
      message: "Save optional Error",
    });
  }
};

export {
  bookSeats,
  cancelReservedBooking,
  checkSeatsAvailability,
  getBookedSeats,
  getBookingsByBuyer,
  getBookingSessionTime,
  reserveSeatsByStaff,
  saveOptionalInfo,
};
