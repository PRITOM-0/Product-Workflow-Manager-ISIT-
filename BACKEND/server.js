import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import ecfRoutes from "./src/routes/ecfRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import listRoutes from "./src/routes/listRoutes.js";


dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;


// ==============================
// DATABASE
// ==============================

await connectDB();

// ==============================
// MIDDLEWARE
// ==============================

app.use(cookieParser());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
  }),
);

// ==============================
// ROOT
// ==============================

app.get("/", (req, res) => {
  res.json({
    message: "PMS IS-IT API is running",
    status: "success",
  });
});

// ==============================
// API ROUTES
// ==============================

app.use("/api/auth", authRoutes);

app.use("/api/ecf", ecfRoutes);

 

app.use("/api/users", userRoutes);

app.use("/api/lists", listRoutes);



// ==============================
// 404
// ==============================

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==============================
// ERROR HANDLER
// ==============================

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && {
      error: error.message,
    }),
  });
});

// ==============================
// START SERVER
// ==============================

app.listen(PORT, () => {
  console.log("");
  console.log("=================================");
  console.log("         PMS IS-IT API");
  console.log("=================================");
  console.log(`Server : http://localhost:${PORT}`);
  console.log(`API    : http://localhost:${PORT}/api`);
  console.log("Database: MongoDB Local");
  console.log("=================================");
  console.log("");
});
