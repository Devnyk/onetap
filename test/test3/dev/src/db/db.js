const mongoose = require("mongoose");

function connectDB() {
  mongoose
    .connect(process.env.MONGO_URI || "mongodb://localhost:27017/myApp")
    .then(() => {
      console.log("✅ Database Connected Successfully");
    })
    .catch((err) => {
      console.log("❌ DB Connection Error:", err);
    });
}

module.exports = connectDB;