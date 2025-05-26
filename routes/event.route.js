import express from "express";
import {
  createEvent,
  deleteEvent,
  getSellerEvents,
  updateEvent,
} from "../controllers/event.controller.js";
import {
  getPublishedEventById,
  getPublishedEvents,
} from "../controllers/publishEvent.controller.js";

import { addSeats, getSeatsByEvent } from "../controllers/seat.controller.js";
import upload from "../middleware/multer.js";
import verifySellerOrAdmin from "../middleware/verifySellerOrAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const eventRouter = express.Router();
eventRouter.get("/events", getPublishedEvents);
eventRouter.get("/events/:id", getPublishedEventById);

eventRouter.post(
  "/create-event",
  upload.single("image"),
  verifyToken,
  verifySellerOrAdmin,
  createEvent
);
eventRouter.get(
  "/my-events",
  verifyToken,
  verifySellerOrAdmin,
  getSellerEvents
);
eventRouter.put("/update/:id", verifyToken, verifySellerOrAdmin, updateEvent);
eventRouter.delete(
  "/delete/:id",
  verifyToken,
  verifySellerOrAdmin,
  deleteEvent
);

eventRouter.post("/seats/add-seats", verifyToken, verifySellerOrAdmin, addSeats);
eventRouter.get("/seats/:eventId", verifyToken, getSeatsByEvent);

export default eventRouter;
