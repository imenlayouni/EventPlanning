const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        passwordHash: {
            type: String,
            default: null
        },
        role: {
            type: String,
            enum: ["admin", "organisateur", "participant"],
            required: true
        },

        status: {
            type: String,
            enum: ["PENDING", "ACTIVE", "REJECTED", "BANNED", "SUSPENDED"],
            default: "PENDING"
        },
        cinPhoto: {
            type: String,
            required: true
        },


        cinVerified: {
            type: Boolean,
            default: false
        },
        location: {
            type: String,
            trim: true
        },
        assets: {
            type: String,
            trim: true
        },
        serviceProfile: {
            category: { type: String, trim: true },
            phone: { type: String, trim: true },
            priceRange: {
                min: { type: Number, default: 0 },
                max: { type: Number, default: 0 }
            },
            availability: [{ type: String }],
            unavailableDates: [{ type: String }],
            averageRating: { type: Number, default: 0 },
            reviewCount: { type: Number, default: 0 }
        }
    },
    {
        timestamps: true
    }
);
userSchema.methods.hasRole = function (role) {
    return this.role === role;
};

module.exports = mongoose.model("User", userSchema);

