import express from "express";
import {
  checkAdmin,
  downloadTickets,
  makeUserAdmin,
} from "../controllers/userController.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const userRouter = express.Router();

// download ticket with pdf
userRouter.get("/download-tickets", verifyToken, downloadTickets);

// Make admin route
userRouter.patch(
  "/users/:id/make-admin",
  verifyToken,
  verifyAdmin,
  makeUserAdmin
);
// check admin route
userRouter.get("/users/admin/:email", verifyToken, checkAdmin);

export default userRouter;
