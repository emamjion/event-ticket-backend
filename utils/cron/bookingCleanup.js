import cron from "node-cron";
import BookingModel from "../../models/booking.model.js";
import EventModel from "../../models/eventModel.js";
import OrderModel from "../../models/orderModel.js";

// Run every 1 minute
cron.schedule("*/1 * * * *", async () => {
  try {
    const now = new Date();

    const expiredBookings = await BookingModel.find({
      isPaid: false,
      status: "pending",
      expiryTime: { $lt: now },
    });

    if (expiredBookings.length > 0) {
      console.log(`Cleaning ${expiredBookings.length} expired bookings...`);
    }

    for (const booking of expiredBookings) {
      booking.status = "cancelled";
      booking.isTicketAvailable = false;
      booking.isUserVisible = false;
      await booking.save();

      const event = await EventModel.findById(booking.eventId);
      if (event) {
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
        await event.save();
      }

      await OrderModel.findOneAndUpdate(
        { bookingId: booking._id },
        { isUserVisible: false }
      );

      console.log(`Booking ${booking._id} auto-cancelled`);
    }
  } catch (err) {
    console.error("Cron Job Error:", err.message);
  }
});
