import BookingModel from "../models/booking.model.js";
import EventModel from "../models/eventModel.js";

// first phase simple booking
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

    // Check if seats already booked or locked
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

    return res.status(200).json({
      success: true,
      message: "Booking created, waiting for payment.",
      bookingId: newBooking._id,
      bookings: newBooking,
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// second phase with coupon code
// const bookSeats = async (req, res) => {
//   const { eventId, buyerId, seats, code } = req.body;

//   if (!eventId || !buyerId || !seats || seats.length === 0) {
//     return res.status(400).json({ message: "Missing required fields." });
//   }

//   try {
//     const event = await EventModel.findById(eventId);
//     if (!event) {
//       return res.status(404).json({ message: "Event not found." });
//     }

//     // Check if seats are already booked
//     const unavailableSeats = seats.filter((s) =>
//       event.seats.some(
//         (b) =>
//           b.section === s.section &&
//           b.row === s.row &&
//           b.seatNumber === s.seatNumber
//       )
//     );

//     if (unavailableSeats.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Some seats are already booked or unavailable.",
//         unavailableSeats,
//       });
//     }

//     // Step 1: Calculate actual total from seat prices
//     const actualTotalAmount = seats.reduce((sum, seat) => sum + seat.price, 0);

//     // Step 2: Apply coupon if valid
//     let finalAmount = actualTotalAmount;

//     if (code) {
//       const coupon = await CouponModel.findOne({
//         code: code.toUpperCase(),
//         eventId,
//         status: "approved",
//         startDate: { $lte: new Date() },
//         endDate: { $gte: new Date() },
//       });

//       if (!coupon) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Invalid or expired coupon code" });
//       }

//       const discount = (coupon.discountPercentage / 100) * actualTotalAmount;
//       finalAmount = parseFloat((actualTotalAmount - discount).toFixed(2));
//     }

//     // Step 3: Save booking
//     const newBooking = new BookingModel({
//       eventId,
//       buyerId,
//       seats,
//       totalAmount: finalAmount,
//       isPaid: false,
//       status: "pending",
//       code: code?.toUpperCase() || null,
//     });

//     await newBooking.save();

//     res.status(200).json({
//       success: true,
//       message: "Booking created, waiting for payment.",
//       bookingId: newBooking._id,
//       payableAmount: finalAmount,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Booking failed", error });
//   }
// };

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

export { bookSeats, getBookingsByBuyer };
