import express from "express";
import { publishTicket } from "../controllers/publishTicketController.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const adminRouter = express.Router();

adminRouter.put(
  "/tickets/:id/publish",
  verifyToken,
  verifyAdmin,
  publishTicket
);

export default adminRouter;
