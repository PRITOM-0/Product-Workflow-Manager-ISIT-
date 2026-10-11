
import mongoose from "mongoose";
import ECF from "../models/ECF.js";

const WORKFLOW_STEPS = [
  "ECF Raise",
  "Approve",
  "CS Approve",
  "Work Order",
  "Product Inhouse",
  "Asset Code Request",
  "Document Update",
  "Product Delivery",
  "User Acknowledgement",
];

// Generate sequential IDs atomically for each year.
// Uses MongoDB's existing database; no extra npm package required.
const generateECFId = async () => {
  const year = new Date().getFullYear();
  const counters = mongoose.connection.collection("counters");

  const counter = await counters.findOneAndUpdate(
    { _id: `ecf_${year}` },
    { $inc: { sequence: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  return `ECF-${year}-${String(counter.sequence).padStart(4, "0")}`;
};

const getActor = (req) =>
  req.user?.userId ||
  req.user?.id ||
  req.user?.username ||
  req.user?.employeeId ||
  null;

const calculateStatus = (workflow = []) => {
  if (workflow.some((step) => step.stepStatus === "rejected")) {
    return "rejected";
  }

  if (
    workflow.length > 0 &&
    workflow.every((step) => step.stepStatus === "completed")
  ) {
    return "completed";
  }

  if (workflow.some((step) => step.stepStatus === "completed" ||
      step.stepStatus === "in-progress")) {
    return "in-progress";
  }

  return "pending";
};

// CREATE ECF
export const createECF = async (req, res) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        message: "Authenticated user not found.",
      });
    }

    const {
      estimatedDeliveryDate,
      company,
      location,
      amount,
      equipmentDetails,
      quantity,
      itPerson,
    } = req.body.ecf || {};

    if (
      !estimatedDeliveryDate ||
      !company?.trim() ||
      !location?.trim() ||
      amount === undefined ||
      amount === "" ||
      !equipmentDetails?.trim() ||
      quantity === undefined ||
      quantity === "" ||
      !itPerson?.trim()
    ) {
      return res.status(400).json({
        message: "Please provide all required ECF details.",
      });
    }

    if (
      !Number.isFinite(Number(amount)) ||
      Number(amount) < 0 ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1 ||
      Number.isNaN(Date.parse(estimatedDeliveryDate))
    ) {
      return res.status(400).json({
        message: "Invalid amount, quantity, or delivery date.",
      });
    }

    const now = new Date().toISOString();
    const ecfId = await generateECFId();

    const workflow = WORKFLOW_STEPS.map((stepName, index) => ({
      serial: index + 1,
      stepName,
      stepStatus: index === 0 ? "completed" : null,
      startDateTime: index === 0 ? now : null,
      endDateTime: index === 0 ? now : null,
      notes: null,
      itPerson: index === 0 ? actor : null,
    }));

    const newECF = await ECF.create({
      ecfId,
      ecf: {
        estimatedDeliveryDate: new Date(
          estimatedDeliveryDate
        ).toISOString(),
        company: company.trim(),
        location: location.trim(),
        amount: Number(amount),
        equipmentDetails: equipmentDetails.trim(),
        quantity: Number(quantity),
        itPerson: itPerson.trim(),
      },
      workflow,
      createdBy: actor,
      status: "in-progress",
    });

    return res.status(201).json({
      message: "ECF created successfully.",
      data: newECF,
    });
  } catch (error) {
    console.error("Create ECF error:", error);

    return res.status(500).json({
      message: "Failed to create ECF.",
    });
  }
};

// GET ALL ECF RECORDS
export const getAllECF = async (req, res) => {
  try {
    const records = await ECF.find().sort({ createdAt: -1 });

    return res.status(200).json({
      message: "ECF records fetched successfully.",
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("Get all ECF error:", error);

    return res.status(500).json({
      message: "Failed to fetch ECF records.",
    });
  }
};

// GET ONE ECF BY INTERNAL ID OR ECF NUMBER
export const getECFById = async (req, res) => {
  try {
    const { id } = req.params;

    const conditions = [{ ecfId: id }];

    if (mongoose.isValidObjectId(id)) {
      conditions.push({ _id: id }, { id });
    }

    const record = await ECF.findOne({ $or: conditions });

    if (!record) {
      return res.status(404).json({
        message: "ECF record not found.",
      });
    }

    return res.status(200).json({
      data: record,
    });
  } catch (error) {
    console.error("Get ECF error:", error);

    return res.status(500).json({
      message: "Failed to fetch ECF.",
    });
  }
};

// UPDATE ECF DETAILS
export const updateECF = async (req, res) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        message: "Authenticated user not found.",
      });
    }

    const { id } = req.params;
    const record = await ECF.findOne({
      $or: [
        { ecfId: id },
        ...(mongoose.isValidObjectId(id)
          ? [{ _id: id }, { id }]
          : []),
      ],
    });

    if (!record) {
      return res.status(404).json({
        message: "ECF record not found.",
      });
    }

    // Only accept editable fields; never allow clients to overwrite
    // workflow, IDs, status, or audit fields through this endpoint.
    const allowedFields = [
      "estimatedDeliveryDate",
      "company",
      "location",
      "amount",
      "equipmentDetails",
      "quantity",
      "itPerson",
    ];

    const changes = req.body.ecf || req.body;
    const editable = Object.keys(changes).filter((key) =>
      allowedFields.includes(key)
    );

    if (editable.length === 0) {
      return res.status(400).json({
        message: "No editable ECF details provided.",
      });
    }

    const next = { ...record.ecf.toObject() };

    for (const key of editable) {
      next[key] = changes[key];
    }

    if (
      !next.company?.trim() ||
      !next.location?.trim() ||
      !next.equipmentDetails?.trim() ||
      !next.itPerson?.trim() ||
      !Number.isFinite(Number(next.amount)) ||
      Number(next.amount) < 0 ||
      !Number.isInteger(Number(next.quantity)) ||
      Number(next.quantity) < 1 ||
      !Number.isFinite(Date.parse(next.estimatedDeliveryDate))
    ) {
      return res.status(400).json({
        message: "Invalid ECF details.",
      });
    }

    next.company = next.company.trim();
    next.location = next.location.trim();
    next.equipmentDetails = next.equipmentDetails.trim();
    next.itPerson = next.itPerson.trim();
    next.amount = Number(next.amount);
    next.quantity = Number(next.quantity);
    next.estimatedDeliveryDate = new Date(
      next.estimatedDeliveryDate
    ).toISOString();

    record.ecf = next;
    record.updatedAt = new Date().toISOString();
    record.updatedBy = actor;

    await record.save();

    return res.status(200).json({
      message: "ECF updated successfully.",
      data: record,
    });
  } catch (error) {
    console.error("Update ECF error:", error);

    return res.status(500).json({
      message: "Failed to update ECF.",
    });
  }
};

// UPDATE A WORKFLOW STEP
export const updateECFWorkflow = async (req, res) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        message: "Authenticated user not found.",
      });
    }

    const { id, serial } = req.params;
    const stepSerial = Number(serial);
    const { stepStatus, notes, itPerson } = req.body;

    if (
      !Number.isInteger(stepSerial) ||
      stepSerial < 1 ||
      stepSerial > WORKFLOW_STEPS.length
    ) {
      return res.status(400).json({
        message: "Invalid workflow step serial.",
      });
    }

    const allowedStatuses = ["in-progress", "completed", "rejected"];

    if (!allowedStatuses.includes(stepStatus)) {
      return res.status(400).json({
        message:
          "stepStatus must be in-progress, completed, or rejected.",
      });
    }

    const record = await ECF.findOne({
      $or: [
        { ecfId: id },
        ...(mongoose.isValidObjectId(id)
          ? [{ _id: id }, { id }]
          : []),
      ],
    });

    if (!record) {
      return res.status(404).json({
        message: "ECF record not found.",
      });
    }

    if (record.status === "completed" || record.status === "rejected") {
      return res.status(400).json({
        message: "This ECF workflow is already closed.",
      });
    }

    const stepIndex = record.workflow.findIndex(
      (step) => step.serial === stepSerial
    );

    if (stepIndex === -1) {
      return res.status(400).json({
        message: "Workflow step not found.",
      });
    }

    const step = record.workflow[stepIndex];

    if (step.stepStatus === "completed" || step.stepStatus === "rejected") {
      return res.status(400).json({
        message: "This workflow step is already closed.",
      });
    }

    // Require all earlier steps to be completed first.
    const previousSteps = record.workflow.slice(0, stepIndex);

    if (
      previousSteps.some((previous) => previous.stepStatus !== "completed")
    ) {
      return res.status(400).json({
        message: "Complete the previous workflow step first.",
      });
    }

    const now = new Date().toISOString();

    if (stepStatus === "in-progress") {
      if (stepIndex > 0 && step.stepStatus !== "in-progress") {
        // Prevent parallel active steps.
        const anotherActiveStep = record.workflow.some(
          (item) => item.stepStatus === "in-progress"
        );

        if (anotherActiveStep) {
          return res.status(400).json({
            message: "Another workflow step is already in progress.",
          });
        }
      }

      step.stepStatus = "in-progress";
      step.startDateTime = step.startDateTime || now;
      step.endDateTime = null;
    }

    if (stepStatus === "completed") {
      step.stepStatus = "completed";
      step.startDateTime = step.startDateTime || now;
      step.endDateTime = now;
    }

    if (stepStatus === "rejected") {
      step.stepStatus = "rejected";
      step.startDateTime = step.startDateTime || now;
      step.endDateTime = now;
    }

    step.itPerson = actor;

    if (notes !== undefined) {
      step.notes = notes === "" ? null : String(notes).trim();
    }

    record.status = calculateStatus(record.workflow);
    record.updatedAt = now;
    record.updatedBy = actor;

    await record.save();

    return res.status(200).json({
      message: "Workflow step updated successfully.",
      data: record,
    });
  } catch (error) {
    console.error("Update ECF workflow error:", error);

    return res.status(500).json({
      message: "Failed to update ECF workflow.",
    });
  }
};

// DELETE ECF
export const deleteECF = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await ECF.findOneAndDelete({
      $or: [
        { ecfId: id },
        ...(mongoose.isValidObjectId(id)
          ? [{ _id: id }, { id }]
          : []),
      ],
    });

    if (!record) {
      return res.status(404).json({
        message: "ECF record not found.",
      });
    }

    return res.status(200).json({
      message: "ECF deleted successfully.",
      data: record,
    });
  } catch (error) {
    console.error("Delete ECF error:", error);

    return res.status(500).json({
      message: "Failed to delete ECF.",
    });
  }
};
