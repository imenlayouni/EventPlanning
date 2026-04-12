const mongoose = require("mongoose");

const ContractSchema = new mongoose.Schema(
  {
    // linked request
    serviceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
      required: true
    },

    // parties
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // service details snapshot
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing"
    },
    serviceTitle: { type: String },
    serviceCategory: { type: String },
    serviceLocation: { type: String },
    agreedPrice: { type: Number },
    eventDate: { type: String },

    // contract terms
    terms: { type: String },

    // signatures
    providerSigned: { type: Boolean, default: false },
    providerSignedAt: { type: Date },
    clientSigned: { type: Boolean, default: false },
    clientSignedAt: { type: Date },

    // status
    status: {
      type: String,
      enum: ["PENDING_SIGNATURES", "FULLY_SIGNED", "CANCELLED"],
      default: "PENDING_SIGNATURES"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contract", ContractSchema);