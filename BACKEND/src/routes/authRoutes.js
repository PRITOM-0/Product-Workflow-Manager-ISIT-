import express from "express";

import {
  loginUser,
  logoutUser,
  currentUser,
  usersList,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();


// Login
router.post("/login", loginUser);


// Logout
router.post("/logout", protect, logoutUser);


// Current logged-in user
router.get("/me", protect, currentUser);


// Admin only
router.get(
  "/userslist",
  usersList
);


export default router;