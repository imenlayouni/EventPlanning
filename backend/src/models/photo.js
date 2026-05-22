const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  description: String,
  category: { type: String, default: "" },
  type: { type: String, enum: ["EVENT", "REVIEW"], required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  review: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Photo", photoSchema);
