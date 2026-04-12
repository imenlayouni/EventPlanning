const User = require("../models/User");
const ServiceRequest = require("../models/ServiceRequest");

//update profile
exports.updateProfile = async (req, res) => {
    try {
        const { category, description, phone, priceRange, availability, location } = req.body;

        const user = await User.findById(req.user._id);
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
        const userId = req.user._id;
        const Listing = require("../models/Listing");

        const pendingRequests = await ServiceRequest.countDocuments({ provider: userId, status: "pending" });
        const acceptedRequests = await ServiceRequest.countDocuments({ provider: userId, status: "accepted" });
        const declinedRequests = await ServiceRequest.countDocuments({ provider: userId, status: "declined" });
        const totalListings = await Listing.countDocuments({ organizer: userId });

        // total earnings from accepted requests with finalPrice
        const accepted = await ServiceRequest.find({ provider: userId, status: "accepted", finalPrice: { $gt: 0 } });
        const totalEarnings = accepted.reduce((acc, r) => acc + (r.finalPrice || 0), 0);

        // requests per month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const requestsPerMonth = await ServiceRequest.aggregate([
            { $match: { provider: userId, createdAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // top listing
        const topListing = await ServiceRequest.aggregate([
            { $match: { provider: userId } },
            { $group: { _id: "$listing", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 },
            { $lookup: { from: "listings", localField: "_id", foreignField: "_id", as: "listing" } },
            { $unwind: "$listing" }
        ]);

        // recent requests
        const recentRequests = await ServiceRequest.find({ provider: userId })
            .populate("user", "firstName lastName")
            .populate("listing", "title")
            .sort({ createdAt: -1 })
            .limit(5);

        const user = await User.findById(userId).select("serviceProfile");

        res.json({
            pendingRequests,
            acceptedRequests,
            declinedRequests,
            totalListings,
            totalEarnings,
            requestsPerMonth,
            topListing: topListing[0] || null,
            recentRequests,
            rating: user.serviceProfile?.averageRating || 0,
            reviewCount: user.serviceProfile?.reviewCount || 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
