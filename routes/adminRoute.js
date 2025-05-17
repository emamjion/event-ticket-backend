import express from "express";
import {
  addNewUserByAdmin,
  approveSellerRequest,
  blockUserById,
  deleteUser,
  denySellerRequest,
  getAllSoldTickets,
  getAllUsers,
  getPendingSellerRequests,
  monitorSellerActivity,
  unblockUserById,
  updateUserRole,
  verifySellerPaymentInfo,
} from "../controllers/adminController.js";
import { publishEvent } from "../controllers/publishEvent.controller.js";
import { handleWithdrawalRequest } from "../controllers/withdrawal.controller.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const adminRouter = express.Router();

// get all routes
adminRouter.get("/users", verifyToken, verifyAdmin, getAllUsers);
// delete user by specific Id
adminRouter.delete("/users/:id", verifyToken, verifyAdmin, deleteUser);

// publish ticket
adminRouter.put("/events/:id/publish", verifyToken, verifyAdmin, publishEvent);

// add new user
adminRouter.post("/add-user", verifyToken, verifyAdmin, addNewUserByAdmin);
// update user role
adminRouter.put("/update-role/:id", verifyToken, verifyAdmin, updateUserRole);
// Block user
adminRouter.put("/block-user/:id", verifyToken, verifyAdmin, blockUserById);

// Unblock user
adminRouter.put("/unblock-user/:id", verifyToken, verifyAdmin, unblockUserById);
// get all sold tickets
adminRouter.get("/sold-tickets", verifyToken, verifyAdmin, getAllSoldTickets);
// verify payment for seller
adminRouter.put(
  "/verify-payment/:sellerId",
  verifyToken,
  verifyAdmin,
  verifySellerPaymentInfo
);

// get all seller requests
adminRouter.get(
  "/seller-request",
  verifyToken,
  verifyAdmin,
  getPendingSellerRequests
);
// approve seller request
adminRouter.patch(
  "/seller-requests/approve/:requestId",
  verifyToken,
  verifyAdmin,
  approveSellerRequest
);

// deny seller request
adminRouter.patch(
  "/seller-requests/deny/:requestId",
  verifyToken,
  verifyAdmin,
  denySellerRequest
);

// route for monitoring seller activity
adminRouter.get(
  "/monitor-seller/:sellerId",
  verifyToken,
  verifyAdmin,
  monitorSellerActivity
);

// route for withdrawal request
adminRouter.put(
  "/handle/:requestId",
  verifyToken,
  verifyAdmin,
  handleWithdrawalRequest
);

// get all sellers
// adminRouter.get("/all-seller", verifyToken, verifyAdmin, getAllSellers);

export default adminRouter;
