import express from "express";
import {
  bookSeats,
  cancelReservedBooking,
  getBookedSeats,
  getBookingsByBuyer,
  reserveSeatsByStaff,
} from "../controllers/booking.controller.js";
import verifySellerOrAdmin from "../middleware/verifySellerOrAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const bookingRouter = express.Router();
bookingRouter.post("/book", verifyToken, bookSeats);
bookingRouter.get("/buyer/:buyerId", verifyToken, getBookingsByBuyer);
bookingRouter.put(
  "/cancel-reserved",
  verifyToken,
  verifySellerOrAdmin,
  cancelReservedBooking
);
bookingRouter.post(
  "/reserve-seats",
  verifyToken,
  verifySellerOrAdmin,
  reserveSeatsByStaff
);
bookingRouter.get("/booked-seats/:eventId", verifyToken, getBookedSeats);

// bookingRouter.patch("/expire-bookings", verifyToken, expireOldBookings);

export default bookingRouter;
