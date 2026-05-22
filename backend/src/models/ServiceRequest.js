const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    requestType: {
        type: String,
        enum: ["price_change", "add_item", "remove_item", "custom"],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    startDate: { type: Date },
    endDate: { type: Date },
    suggestedPrice: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "declined"],
        default: "pending"
    },
    providerNote: {
        type: String,
        default: ""
    },
    finalPrice: {
        type: Number,
        default: null
    },
    contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contract",
    default: null
},
    formAnswers: [
        {
            label: { type: String },
            value: { type: String }
        }
    ],
    messages: [
        {
            senderRole: { type: String, enum: ["provider", "participant"], required: true },
            text: { type: String, required: true },
            sentAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
