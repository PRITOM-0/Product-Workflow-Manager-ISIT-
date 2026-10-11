import express from "express";

import {
  getUsers,
  getUsersList,
  getUserById,
  createUser,
  updateUser,
  patchUser,
  deleteUser
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", protect,authorizeRoles("Admin"), getUsers);
router.get("/userslist", getUsersList);
router.get("/:id", protect,authorizeRoles("Admin"), getUserById);

router.post("/", protect, authorizeRoles("Admin"), createUser);

router.put("/:id", protect, authorizeRoles("Admin"), updateUser);
router.patch("/:id", protect, authorizeRoles("Admin"), patchUser);

router.delete("/:id", protect, authorizeRoles("Admin"), deleteUser);

export default router;