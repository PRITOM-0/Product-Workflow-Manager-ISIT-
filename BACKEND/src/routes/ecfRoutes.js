
import express from "express";

import {
  createECF,
  getAllECF,
  getECFById,
  updateECF,
  updateECFWorkflow,
  deleteECF,
} from "../controllers/ecfController.js";

const router = express.Router();

router.post("/", createECF);
router.get("/", getAllECF);
router.get("/:id", getECFById);
router.put("/:id", updateECF);
router.patch("/:id/workflow/:serial", updateECFWorkflow);
router.delete("/:id", deleteECF);

export default router;
