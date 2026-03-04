const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      required: true,
      trim: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available"
    }
  }
);

module.exports = mongoose.model("Resource", ResourceSchema);
