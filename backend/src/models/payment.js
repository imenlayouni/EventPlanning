const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
      unique: true
    },

    method: {
      type: String,
      enum: ["stripe", "paypal"],
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },

    transactionRef: {
      type: String,
      default: ""
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    paidAt: {
      type: Date
    },
  
    contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contract"
    }
  },

  {
    timestamps: true
  }

);

module.exports = mongoose.model("Payment", PaymentSchema);
