import express from "express";
import { createEvent } from "../controllers/event.controller.js";
import {
  getPublishedEventById,
  getPublishedEvents,
} from "../controllers/publishEvent.controller.js";
import { lockSeats } from "../controllers/seatLock.controller.js";
import verifySeller from "../middleware/verifySeller.js";
import verifyToken from "../middleware/verifyToken.js";

const eventRouter = express.Router();
eventRouter.post("/create-event", verifyToken, verifySeller, createEvent);
eventRouter.get("/events", getPublishedEvents);
eventRouter.get("/events/:id", getPublishedEventById);
eventRouter.post("/events/:id/lock-seats", verifyToken, lockSeats);
export default eventRouter;
