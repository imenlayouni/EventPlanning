const mongoose = require("mongoose");

const ContractSchema = new mongoose.Schema(
  {
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
      unique: true
    },

    status: {
      type: String,
      enum: ["ACTIVE", "TERMINATED"],
      default: "ACTIVE"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contract", ContractSchema);
