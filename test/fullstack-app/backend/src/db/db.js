import mongoose from "mongoose";

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/myApp");
    console.log("✅ Database Connected Successfully");
  } catch (err) {
    console.log("❌ DB Connection Error:", err);
    process.exit(1);
  }
}

export default connectDB;