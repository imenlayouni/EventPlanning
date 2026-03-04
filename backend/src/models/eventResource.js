const mongoose = require("mongoose");

const EventResourceSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: true
    },

    quantityUsed: {
      type: Number,
      required: true,
      min: 1
    }
  }
);

module.exports = mongoose.model("EventResource", EventResourceSchema);
