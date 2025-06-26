import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import connectCloudinary from "../config/cloudinary.js";
import connectDB from "../config/mongodb.js";
import adminRouter from "../routes/adminRoute.js";
import authRouter from "../routes/authRoute.js";
import blogRouter from "../routes/blog.route.js";
import bookingRouter from "../routes/booking.route.js";
import couponRouter from "../routes/coupon.route.js";
import eventRouter from "../routes/event.route.js";
import orderRouter from "../routes/orderRoute.js";
import paymentRouter from "../routes/paymentRoute.js";
import sellerRequestRouter from "../routes/sellerRequestRoute.js";
import sellerRouter from "../routes/sellerRoute.js";
import userRouter from "../routes/userRoute.js";
import withdrawalRouter from "../routes/withdrawal.route.js";
// import jwtRouter from "../routes/jwtRoute.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ credentials: true }));
app.use(cookieParser());

connectDB();
connectCloudinary();

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/seller", sellerRouter);
app.use("/api/v1/seller-request", sellerRequestRouter);

app.use("/api/v1/event", eventRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/withdraw", withdrawalRouter);
app.use("/api/v1/coupons", couponRouter);
app.use("/api/v1/blogs", blogRouter);

// Root route
app.get("/", (req, res) => {
  res.send("Server is running from Vercel!");
});

// DON'T listen to port in Vercel
export default app;
