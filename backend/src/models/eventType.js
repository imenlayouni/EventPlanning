const mongoose = require("mongoose");

const EventTypeSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("EventType", EventTypeSchema);
