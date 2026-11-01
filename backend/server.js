require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const studentRoutes = require("./routes/studentRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Home page
app.get("/", (req, res) => {
  res.send("Student Management System Backend is Running!");
});

// Student CRUD API
app.use("/api/students", studentRoutes);

// MongoDB connection
const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/studentManagementDB";

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("MongoDB Connected Successfully!");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error.message);
  });
