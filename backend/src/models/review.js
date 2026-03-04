const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  rating: { type: Number },
  comment: { type: String },
  isHateful: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);
