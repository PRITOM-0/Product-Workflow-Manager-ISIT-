
import mongoose from "mongoose";

const workflowStepSchema = new mongoose.Schema(
  {
    serial: {
      type: Number,
      required: true,
    },

    stepName: {
      type: String,
      required: true,
      trim: true,
    },

    stepStatus: {
      type: String,
      enum: ["pending", "in-progress", "completed", "rejected", null],
      default: null,
    },

    startDateTime: {
      type: String,
      default: null,
    },

    endDateTime: {
      type: String,
      default: null,
    },

    notes: {
      type: String,
      default: null,
      trim: true,
    },

    itPerson: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const ecfDetailsSchema = new mongoose.Schema(
  {
    estimatedDeliveryDate: {
      type: String,
      required: true,
    },

    company: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    equipmentDetails: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    itPerson: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const workflowSteps = [
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

const ecfSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },

    ecfId: {
      type: String,
      unique: true,
      trim: true,
    },

    ecf: {
      type: ecfDetailsSchema,
      required: true,
    },

    workflow: {
      type: [workflowStepSchema],
      default: () =>
        workflowSteps.map((stepName, index) => ({
          serial: index + 1,
          stepName,
          stepStatus: null,
          startDateTime: null,
          endDateTime: null,
          notes: null,
          itPerson: null,
        })),
    },

    createdBy: {
      type: String,
      required: true,
      trim: true,
    },

    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },

    updatedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },

    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "rejected"],
      default: "in-progress",
    },
  },
  {
    versionKey: false,
  }
);

// Automatically update updatedAt before saving.
ecfSchema.pre("save", function () {
  this.updatedAt = new Date().toISOString();
});

export default mongoose.model("ECF", ecfSchema);
