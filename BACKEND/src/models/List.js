import mongoose from "mongoose";

const listSchema = new mongoose.Schema(
  {
    company: {
      type: [String],
      default: [],
    },

    Location: {
      type: [String],
      default: [],
    },

    department: {
      type: [String],
      default: [],
    },
 
    equipment: {
      type: [String],
      default: [],
    },

   
  },
  {
    versionKey: false,
  }
);

export default mongoose.model("List", listSchema);