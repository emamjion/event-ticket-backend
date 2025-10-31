import express from "express";
import {
  addNewUserByAdmin,
  approveSellerRequest,
  blockUserById,
  createModerator,
  deleteModerator,
  deleteUser,
  denySellerRequest,
  getAllBookings,
  getAllEventsForAdmin,
  getAllModerators,
  getAllSoldTickets,
  getAllTransactions,
  getAllUsers,
  getPendingSellerRequests,
  getSingleModerator,
  monitorSellerActivity,
  unblockUserById,
  updateModerator,
  updateUserRole,
  verifySellerPaymentInfo,
} from "../controllers/adminController.js";
import {
  generateSalesReport,
  generateTransactionReport,
  generateUserReport,
} from "../controllers/generateReports.controller.js";
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

adminRouter.get("/events", verifyToken, verifyAdmin, getAllEventsForAdmin);
adminRouter.get("/transactions", verifyToken, verifyAdmin, getAllTransactions);

// Generate rports routes
adminRouter.get("/sales-report", verifyToken, verifyAdmin, generateSalesReport);
adminRouter.get("/users-report", verifyToken, verifyAdmin, generateUserReport);
adminRouter.get(
  "/transactions-report",
  verifyToken,
  verifyAdmin,
  generateTransactionReport
);

// get all bookings
adminRouter.get("/all-bookings", verifyToken, verifyAdmin, getAllBookings);


// Only admin can create moderator
adminRouter.post(
  "/create-moderator",
  verifyToken,
  verifyAdmin,
  createModerator
);

adminRouter.get("/moderators", verifyToken, verifyAdmin, getAllModerators);
adminRouter.get(
  "/moderators/:id",
  verifyToken,
  verifyAdmin,
  getSingleModerator
);
adminRouter.put("/moderators/:id", verifyToken, verifyAdmin, updateModerator);
adminRouter.delete(
  "/moderators/:id",
  verifyToken,
  verifyAdmin,
  deleteModerator
);

export default adminRouter;
