const ServiceRequest = require("../models/ServiceRequest");

// User creates a new request
exports.createRequest = async (req, res) => {
    try {
        const { provider, listing, requestType, description, suggestedPrice, startDate, endDate } = req.body;

        // Basic date validation when provided
        let sDate = null;
        let eDate = null;
        if (startDate || endDate) {
            if (!startDate || !endDate) {
                return res.status(400).json({ message: "Both startDate and endDate must be provided for a dated request." });
            }
            sDate = new Date(startDate);
            eDate = new Date(endDate);
            if (isNaN(sDate) || isNaN(eDate) || sDate > eDate) {
                return res.status(400).json({ message: "Invalid date range." });
            }
        }

        const request = await ServiceRequest.create({
            user: req.user.id,
            provider,
            listing,
            requestType,
            description,
            suggestedPrice: suggestedPrice || null,
            startDate: sDate || undefined,
            endDate: eDate || undefined
        });

        const populated = await ServiceRequest.findById(request._id)
            .populate("user", "firstName lastName email")
            .populate("provider", "firstName lastName email")
            .populate("listing", "title category price");

        res.status(201).json(populated);
    } catch (err) {
        console.error("Error creating request:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// User gets their own sent requests
exports.getMyRequests = async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ user: req.user.id })
            .populate("provider", "firstName lastName email")
            .populate("listing", "title category price images")
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (err) {
        console.error("Error fetching user requests:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Provider gets incoming requests
exports.getProviderRequests = async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ provider: req.user.id })
            .populate("user", "firstName lastName email")
            .populate("listing", "title category price images")
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (err) {
        console.error("Error fetching provider requests:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Provider updates request status (accept/decline)
exports.updateRequestStatus = async (req, res) => {
    try {
        const { status, providerNote, finalPrice } = req.body;

        const request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found" });

        if (request.provider.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        request.status = status;
        if (providerNote) request.providerNote = providerNote;
        if (status === "accepted" && finalPrice) {
            request.finalPrice = finalPrice;
        }
        await request.save();

        const populated = await ServiceRequest.findById(request._id)
            .populate("user", "firstName lastName email")
            .populate("provider", "firstName lastName email")
            .populate("listing", "title category price");

        res.json(populated);
    } catch (err) {
        console.error("Error updating request:", err);
        res.status(500).json({ message: "Server error" });
    }
};
