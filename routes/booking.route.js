import express from "express";
import {
  bookSeats,
  cancelBooking,
  // expireOldBookings,
  getBookingsByBuyer,
  reserveSeatsBySeller,
} from "../controllers/booking.controller.js";
import verifySeller from "../middleware/verifySeller.js";
import verifyToken from "../middleware/verifyToken.js";

const bookingRouter = express.Router();
bookingRouter.post("/book", verifyToken, bookSeats);
bookingRouter.get("/buyer/:buyerId", verifyToken, getBookingsByBuyer);
bookingRouter.put("/cancel/:bookingId", verifyToken, cancelBooking);
bookingRouter.post(
  "/reserve-seats",
  verifyToken,
  verifySeller,
  reserveSeatsBySeller
);

// bookingRouter.patch("/expire-bookings", verifyToken, expireOldBookings);

export default bookingRouter;
