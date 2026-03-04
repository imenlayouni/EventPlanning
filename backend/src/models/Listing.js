const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
    {
        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        location: {
            type: String,
            required: true,
            trim: true
        },
        images: [{
            type: String
        }],
        price: {
            type: String, 
            required: true
        },
        category: {
            type: String,
            required: true,
            trim: true
        },
        assets: {
            type: String,
            trim: true
        },
        available: {
            type: Boolean,
            default: true
        },
        approved: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Listing", listingSchema);
