const Listing = require("../models/Listing");
const User = require("../models/User");
const Event = require("../models/event");
const { filterBySearch, splitByLocation, askGemini } = require("../services/recommendationService");

exports.getRecommendations = async (req, res) => {
    try {
        const { search } = req.body;
        const user = await User.findById(req.user.id);
        const allListings = await Listing.find({ approved: true }).populate("organizer", "firstName lastName");

        if (allListings.length === 0) return res.json([]);

        // Gather user's past event history categories
        const userEvents = await Event.find({ organizer: req.user.id }).populate("services");
        const historyCategories = [
            ...new Set(
                userEvents.flatMap(e => e.services.map(s => (s.category || "").toLowerCase())).filter(Boolean)
            )
        ];

        const userLocation = (user.location || "").toLowerCase().trim();
        const searchTerm = (search || "").toLowerCase().trim();
        const topN = searchTerm ? 5 : 3;

        // Filter by search term, then split by location
        const filtered = filterBySearch(allListings, searchTerm);
        const { sameLocation, otherLocation } = splitByLocation(filtered, userLocation);

        // Same-city listings are always included first
        const guaranteed = sameLocation.slice(0, topN);
        const slotsLeft = topN - guaranteed.length;

        // Ask Gemini only to fill remaining slots from other cities
        let aiPicked = [];
        if (slotsLeft > 0 && otherLocation.length > 0) {
            const candidates = otherLocation.slice(0, 20).map(l => ({
                id: l._id.toString(),
                title: l.title,
                category: l.category,
                location: l.location,
                description: (l.description || "").substring(0, 150),
                price: l.price,
            }));
            aiPicked = await askGemini(candidates, slotsLeft, user.location, historyCategories);
        }

        const listingMap = Object.fromEntries(allListings.map(l => [l._id.toString(), l]));

        const localResults = guaranteed.map(l => ({
            ...l.toObject(),
            reason: `Available in ${l.location} — close to your location.`,
        }));

        const aiResults = aiPicked
            .filter(item => item.id && listingMap[item.id])
            .map(item => ({
                ...listingMap[item.id].toObject(),
                reason: item.reason || "",
            }));

        res.json([...localResults, ...aiResults]);
    } catch (err) {
        console.error("Recommendation error:", err);
        res.status(500).json({ message: "Failed to get recommendations" });
    }
};
