const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event"
        },
        listing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listing"
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        read: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Message", messageSchema);
