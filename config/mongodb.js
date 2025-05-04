import mongoose from "mongoose";

// connect to mongodb
const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("Database connected...");
  });
  mongoose.connection.on("error", (err) => {
    console.log("MongoDB connection error: ", err);
  });
  await mongoose.connect(`${process.env.MONGO_URI}`);
};

export default connectDB;
