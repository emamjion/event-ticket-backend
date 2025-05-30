import express from "express";
import {
  applyCoupon,
  //   approveCoupon,
  createCoupon,
  deleteCoupon,
  getSellerCoupons,
  permanentlyDeleteCoupon,
  restoreCoupon,
  toggleCouponStatus,
  updateCoupon,
} from "../controllers/coupon.controller.js";
// import verifyAdmin from "../middleware/verifyAdmin.js";
import verifySeller from "../middleware/verifySeller.js";
import verifySellerOrAdmin from "../middleware/verifySellerOrAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const couponRouter = express.Router();
// couponRouter.post("/create-coupon", verifyToken, verifySeller, createCoupon);
couponRouter.post(
  "/create-coupon",
  verifyToken,
  verifySellerOrAdmin,
  createCoupon
);
// couponRouter.patch("/update/:id", verifyToken, verifySeller, updateCoupon);
couponRouter.patch(
  "/update/:id",
  verifyToken,
  verifySellerOrAdmin,
  updateCoupon
);
// soft delete coupon route
// couponRouter.delete("/delete/:id", verifyToken, verifySeller, deleteCoupon);
couponRouter.delete(
  "/delete/:id",
  verifyToken,
  verifySellerOrAdmin,
  deleteCoupon
);
// permanent delete coupon route
couponRouter.delete(
  "/permanent-delete/:id",
  verifyToken,
  verifySellerOrAdmin,
  permanentlyDeleteCoupon
);
couponRouter.patch("/restore/:id", verifyToken, verifySeller, restoreCoupon);
couponRouter.patch(
  "/toggle-status/:id",
  verifyToken,
  verifySeller,
  toggleCouponStatus
);
// couponRouter.get("/my-coupons", verifyToken, verifySeller, getSellerCoupons);
couponRouter.get(
  "/my-coupons",
  verifyToken,
  verifySellerOrAdmin,
  getSellerCoupons
);
// couponRouter.put(
//   "/coupon-approve/:id",
//   verifyToken,
//   verifyAdmin,
//   approveCoupon
// );
couponRouter.post("/apply-coupon", verifyToken, applyCoupon);

export default couponRouter;
