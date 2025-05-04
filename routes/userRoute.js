import express from "express";
import {
  checkAdmin,
  deleteUser,
  getAllUsers,
  makeUserAdmin,
} from "../controllers/userController.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const userRouter = express.Router();

// get all routes
userRouter.get("/users", verifyToken, verifyAdmin, getAllUsers);
// delete user by specific Id
userRouter.delete("/users/:id", verifyToken, verifyAdmin, deleteUser);
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
