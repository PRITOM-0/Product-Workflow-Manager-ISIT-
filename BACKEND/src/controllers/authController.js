import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Create JWT
const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { user_id, password } = req.body;

    const user = await User.findOne({ _id: user_id });

    // Plain-text password comparison
    if (!user || user.password !== password) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    // Create JWT
    const token = createToken(user._id);

    // Store JWT in HttpOnly cookie
 
    // Store JWT in HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // For HTTP on your office LAN
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });
    console.log("Token set in cookie:", token);

    // Don't send password to frontend
    const userData = {
      _id: user._id,
      username: user.username,
      role: user.role,
    };

    res.status(200).json({
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Failed to login",
      error: error.message,
    });
  }
};

// POST /api/auth/logout
export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);

    res.status(500).json({
      message: "Failed to logout",
      error: error.message,
    });
  }
};

// GET /api/auth/me
export const currentUser = async (req, res) => {
  try {
    res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    console.error("Current user error:", error);

    res.status(500).json({
      message: "Failed to get current user",
      error: error.message,
    });
  }
};

// GET /api/auth/userslist
export const usersList = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);

    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};
