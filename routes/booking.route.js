import express from "express";
import {
  bookSeats,
  getBookingsByBuyer,
} from "../controllers/booking.controller.js";
import verifyToken from "../middleware/verifyToken.js";

const bookingRouter = express.Router();
bookingRouter.post("/book", verifyToken, bookSeats);
bookingRouter.get("/buyer/:buyerId", verifyToken, getBookingsByBuyer);

export default bookingRouter;
