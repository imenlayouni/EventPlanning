const ServiceRequest = require("../models/ServiceRequest");
const Contract = require("../models/contract");
const notify = require("../services/notify");

// User creates a new request
exports.createRequest = async (req, res) => {
    try {
        const { provider, listing, requestType, description, suggestedPrice, startDate, endDate } = req.body;

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
            user: req.user._id,
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

        // notify provider when new request comes in
        await notify(
            request.provider,
            "New Request Received 📩",
            `${populated.user?.firstName} ${populated.user?.lastName} sent a request for "${populated.listing?.title}"`,
            "request"
        );

        res.status(201).json(populated);
    } catch (err) {
        console.error("Error creating request:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// User gets their own sent requests
exports.getMyRequests = async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ user: req.user._id })
            .populate("provider", "firstName lastName email")
            .populate("listing", "title category price images")
            .populate("contract")
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
        const requests = await ServiceRequest.find({ provider: req.user._id })
            .populate("user", "firstName lastName email")
            .populate("listing", "title category price images")
            .populate("contract")
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

        if (request.provider.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        request.status = status;
        if (providerNote) request.providerNote = providerNote;
        if (status === "accepted" && finalPrice) {
            request.finalPrice = finalPrice;
        }

        let populated = null;

        // auto-generate contract when provider accepts
        if (status === "accepted") {
            populated = await ServiceRequest.findById(request._id)
                .populate("listing", "title category location price");

            const terms = `SERVICE CONTRACT

This agreement is entered between the Service Provider and the Client for the following service:

Service: ${populated.listing?.title || "N/A"}
Category: ${populated.listing?.category || "N/A"}
Location: ${populated.listing?.location || "N/A"}
Agreed Price: $${finalPrice || populated.listing?.price || "N/A"}
Event Date: ${request.startDate ? new Date(request.startDate).toLocaleDateString() : "To be confirmed"}

TERMS AND CONDITIONS:

1. SERVICES: The Provider agrees to deliver the above-mentioned service on the agreed date and location.

2. PAYMENT: The Client agrees to pay the full agreed price before or on the day of the event. Payment is non-refundable unless the Provider cancels.

3. CANCELLATION: Either party may cancel this contract with at least 7 days written notice. Cancellation within 7 days of the event may incur a cancellation fee of up to 50% of the agreed price.

4. RESPONSIBILITIES: The Provider is responsible for delivering the service as described. The Client is responsible for providing accurate event details.

5. LIABILITY: Neither party shall be liable for failure to perform due to circumstances beyond their control (force majeure).

6. DISPUTE RESOLUTION: Any disputes shall be resolved through mutual agreement. If unresolved, both parties agree to seek mediation.

7. AGREEMENT: By signing this contract digitally, both parties agree to all terms and conditions stated above.

Generated on: ${new Date().toLocaleDateString()}`;

            const contract = await Contract.create({
                serviceRequest: request._id,
                provider: request.provider,
                client: request.user,
                listing: request.listing,
                serviceTitle: populated.listing?.title,
                serviceCategory: populated.listing?.category,
                serviceLocation: populated.listing?.location,
                agreedPrice: finalPrice || null,
                eventDate: request.startDate ? new Date(request.startDate).toLocaleDateString() : null,
                terms,
                providerSigned: false,
                clientSigned: false,
                status: "PENDING_SIGNATURES"
            });

            console.log("Contract created:", contract._id);
            request.contract = contract._id;
        }

        await request.save();

        // notify user when request is accepted/declined
        if (status === "accepted" || status === "declined") {
            if (!populated) {
                populated = await ServiceRequest.findById(request._id)
                    .populate("listing", "title category location price");
            }
            await notify(
                request.user,
                status === "accepted" ? "Request Accepted! 🎉" : "Request Declined",
                status === "accepted"
                    ? `Your request for "${populated.listing?.title}" has been accepted. A contract has been generated.`
                    : `Your request for "${populated.listing?.title}" has been declined.`,
                "request"
            );
        }

        const final = await ServiceRequest.findById(request._id)
            .populate("user", "firstName lastName email")
            .populate("provider", "firstName lastName email")
            .populate("listing", "title category price")
            .populate("contract");

        res.json(final);
    } catch (err) {
        console.error("Error updating request:", err);
        res.status(500).json({ message: "Server error" });
    }
};