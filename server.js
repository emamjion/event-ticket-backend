import cors from "cors";
import "dotenv/config";
import express from "express";
import connectCloudinary from "./config/cloudinary.js";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoute.js";
import ticketRouter from "./routes/ticketRoute.js";
import userRouter from "./routes/userRoute.js";
// import jwtRouter from "./routes/jwtRoute.js";

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cors());

connectDB();
connectCloudinary();

// app routes
// tickets
app.use("/api/v1/ticket", ticketRouter);
// auth routes
app.use("/api/v1/auth", authRouter);
// user routes
app.use("/api/v1/user", userRouter);

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
