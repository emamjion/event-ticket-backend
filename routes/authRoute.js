import express from "express";
import {
  createUser,
  loginUser,
  logoutUser,
} from "../controllers/authController.js";

const authRouter = express.Router();

// POST /users — Create New User
authRouter.post("/create-user", createUser);
authRouter.post("/login", loginUser);
authRouter.post("/logout", logoutUser);

export default authRouter;
