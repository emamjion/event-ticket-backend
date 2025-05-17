import express from "express";
import {
  createWithdrawalRequest,
  getMyWithdrawalRequests,
} from "../controllers/withdrawal.controller.js";
import verifyToken from "../middleware/verifyToken.js";

const withdrawalRouter = express.Router();
withdrawalRouter.post(
  "/request-withdrawal",
  verifyToken,
  createWithdrawalRequest
);
withdrawalRouter.get("/my-request", verifyToken, getMyWithdrawalRequests);

export default withdrawalRouter;
