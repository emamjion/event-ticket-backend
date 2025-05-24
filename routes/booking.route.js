import express from "express";
import {
  bookSeats,
  getBookingsByBuyer,
} from "../controllers/booking.controller.js";
import { reserveSeatsForSeller } from "../controllers/sellerBooking.controller.js";
import verifySeller from "../middleware/verifySeller.js";
import verifyToken from "../middleware/verifyToken.js";

const bookingRouter = express.Router();
bookingRouter.post("/book", verifyToken, bookSeats);
bookingRouter.get("/buyer/:buyerId", verifyToken, getBookingsByBuyer);
bookingRouter.post(
  "/reserve",
  verifyToken,
  verifySeller,
  reserveSeatsForSeller
);

export default bookingRouter;
