const Listing = require("../models/Listing");

//create a new listing
exports.createListing = async (req, res) => {
    try {
        const { title, description, location, price, category, assets } = req.body;
        let fields = [];
        if (req.body.fields) {
            try {
                fields = JSON.parse(req.body.fields);
            } catch (e) {
                fields = [];
            }
        }

        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = req.files.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);
        }

        const listing = await Listing.create({
            organizer: req.user._id,
            title,
            description,
            location,
            images: imageUrls,
            price,
            category,
            assets,
            fields
        });
        

        const populatedListing = await Listing.findById(listing._id).populate("organizer", "firstName lastName email serviceProfile");

        res.status(201).json(populatedListing);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

//update listing
exports.updateListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) return res.status(404).json({ message: "Listing not found" });
        if (listing.organizer.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized" });

        const updateData = { ...req.body };

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);
            updateData.images = newImages;
        }

        const updatedListing = await Listing.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updatedListing);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

//delete listing
exports.deleteListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) return res.status(404).json({ message: "Listing not found" });
        if (listing.organizer.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized" });

        await listing.deleteOne();
        res.json({ message: "Listing deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

//get listings(all or by organizer)
exports.getListings = async (req, res) => {
    try {
        const { organizer, category, search } = req.query;
        let query = {};

        if (organizer && organizer !== "undefined" && organizer !== "null") {
            query.organizer = organizer;
        }
        if (category && category !== "all") query.category = category;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } }
            ];
        }

        // by default only return approved listings to public
        if (!organizer) query.approved = true;

        const listings = await Listing.find(query)
            .populate("organizer", "firstName lastName email serviceProfile") // Get organizer details
            .sort({ createdAt: -1 });

        res.json(listings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

//get single listing
exports.getListingById = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id).populate("organizer", "firstName lastName email serviceProfile");
        if (!listing) return res.status(404).json({ message: "Listing not found" });
        res.json(listing);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
