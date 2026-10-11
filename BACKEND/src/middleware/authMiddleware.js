import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
   
   
    // Get JWT from cookie
    const token = req.cookies.token;
    
    console.log("Token from cookie:", req);

    if (!token) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );
    console.log("Decoded token:", decoded);

    // Get current user from database
    const user = await User.findById(decoded.userId)
      .select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }
    // Attach user to request
    req.user = user;
     console.log("Auth middleware invoked");
    next();

  } catch (error) {
    console.error("Auth middleware error:", error);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};