import cors from "cors";
import "dotenv/config";
import express from "express";
import connectCloudinary from "./config/cloudinary.js";
import connectDB from "./config/mongodb.js";
import adminRouter from "./routes/adminRoute.js";
import authRouter from "./routes/authRoute.js";
import blogRouter from "./routes/blog.route.js";
import bookingRouter from "./routes/booking.route.js";
import couponRouter from "./routes/coupon.route.js";
import eventRouter from "./routes/event.route.js";
import orderRouter from "./routes/orderRoute.js";
import paymentRouter from "./routes/paymentRoute.js";
import sellerRequestRouter from "./routes/sellerRequestRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import userRouter from "./routes/userRoute.js";
import withdrawalRouter from "./routes/withdrawal.route.js";
// import jwtRouter from "./routes/jwtRoute.js";

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cors());

connectDB();
connectCloudinary();

// app routes
// auth routes
app.use("/api/v1/auth", authRouter);
// user routes
app.use("/api/v1/user", userRouter);
// admin router
app.use("/api/v1/admin", adminRouter);
// payment router
app.use("/api/v1/payments", paymentRouter);
// order router
app.use("/api/v1/orders", orderRouter);
// seller router
app.use("/api/v1/seller", sellerRouter);
// seller request router
app.use("/api/v1/seller-request", sellerRequestRouter);

app.use("/api/v1/event", eventRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/withdraw", withdrawalRouter);
app.use("/api/v1/coupons", couponRouter);
app.use("/api/v1/blogs", blogRouter);

// JWT route (optional)
// app.use("/api", jwtRouter);

// Root route for run server
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// start server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
