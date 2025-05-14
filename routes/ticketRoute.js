import express from "express";
import { createTicket } from "../controllers/ticketController.js";
import verifySeller from "../middleware/verifySeller.js";
import verifyToken from "../middleware/verifyToken.js";

const ticketRouter = express.Router();

ticketRouter.post("/create-ticket", verifyToken, verifySeller, createTicket);
export default ticketRouter;
