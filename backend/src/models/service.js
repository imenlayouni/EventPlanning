const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: false
    },

    serviceTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceType",
      required: false
    },

    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED"],
      default: "PENDING"
    },
    additionalServicesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdditionalService"
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },

    requestGroupId: {
      type: String,
    },
    itemIds: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceItem"
    },
    attributes: [{
      label: String,
      value: mongoose.Schema.Types.Mixed,
    }],


    reviews: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      createdAt: { type: Date, default: Date.now }
    }]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Service", ServiceSchema);
