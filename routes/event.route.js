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

import verifySeller from "../middleware/verifySeller.js";
import verifyToken from "../middleware/verifyToken.js";

const eventRouter = express.Router();
eventRouter.get("/events", getPublishedEvents);
eventRouter.get("/events/:id", getPublishedEventById);

eventRouter.post("/create-event", verifyToken, verifySeller, createEvent);
eventRouter.get("/my-events", verifyToken, verifySeller, getSellerEvents);
eventRouter.put("/update/:id", verifyToken, verifySeller, updateEvent);
eventRouter.delete("/delete/:id", verifyToken, verifySeller, deleteEvent);

export default eventRouter;
