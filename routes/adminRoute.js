import express from "express";
import {
  addNewUserByAdmin,
  blockUserById,
  deleteUser,
  getAllUsers,
  unblockUserById,
  updateUserRole,
} from "../controllers/adminController.js";
import { publishTicket } from "../controllers/publishTicketController.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const adminRouter = express.Router();

// get all routes
adminRouter.get("/users", verifyToken, verifyAdmin, getAllUsers);
// delete user by specific Id
adminRouter.delete("/users/:id", verifyToken, verifyAdmin, deleteUser);

// publish ticket
adminRouter.put(
  "/tickets/:id/publish",
  verifyToken,
  verifyAdmin,
  publishTicket
);

// add new user
adminRouter.post("/add-user", verifyToken, verifyAdmin, addNewUserByAdmin);
// update user role
adminRouter.put("/update-role/:id", verifyToken, verifyAdmin, updateUserRole);
// Block user
adminRouter.put("/block-user/:id", verifyToken, verifyAdmin, blockUserById);

// Unblock user
adminRouter.put("/unblock-user/:id", verifyToken, verifyAdmin, unblockUserById);

export default adminRouter;
