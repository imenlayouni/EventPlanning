const User = require("../models/User");
const Service = require("../models/service");
const ServiceRequest = require("../models/ServiceRequest");

//update profile
exports.updateProfile = async (req, res) => {
    try {
        const { category, description, phone, priceRange, availability, location } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (location) user.location = location;
        if (category) user.serviceProfile.category = category;
        if (description) user.serviceProfile.description = description;
        if (phone) user.serviceProfile.phone = phone;
        if (priceRange) user.serviceProfile.priceRange = priceRange;
        if (availability) user.serviceProfile.availability = availability;

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};



//get dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const totalEvents = await Service.countDocuments({ providerId: userId, status: "COMPLETED" });
        const pendingRequests = await ServiceRequest.countDocuments({ provider: userId, status: "pending" });
        const user = await User.findById(userId).select("serviceProfile");

        res.json({
            totalEvents,
            pendingRequests,
            rating: user.serviceProfile.averageRating,
            reviewCount: user.serviceProfile.reviewCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

