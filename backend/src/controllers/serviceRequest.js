const ServiceRequest = require("../models/ServiceRequest");
const Contract = require("../models/contract");
const notify = require("../services/notify");
const sendMail = require("../services/mail");

// User creates a new request
exports.createRequest = async (req, res) => {
    try {
        const { provider, listing, requestType, description, suggestedPrice, startDate, endDate, formAnswers } = req.body;

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
            endDate: eDate || undefined,
            formAnswers: Array.isArray(formAnswers) ? formAnswers : []
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

        // send email to provider
        if (populated.provider?.email) {
            try {
                await sendMail(
                    populated.provider.email,
                    "New Service Request Received - Axia Event Planner",
                    `Hello ${populated.provider.firstName},\n\nYou have received a new service request!\n\nFrom: ${populated.user?.firstName} ${populated.user?.lastName}\nService: ${populated.listing?.title}\nDescription: ${req.body.description}\n\nPlease log in to your dashboard to review and respond to this request.\n\nBest regards,\nAxia Event Planner Team`
                );
            } catch (mailErr) {
                console.error("Failed to send email to provider:", mailErr.message);
            }
        }

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

// Unified messaging between provider and participant (works while request is pending or accepted)
exports.sendMessage = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ message: "Message text is required" });

        const request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found" });

        const isProvider = request.provider.toString() === req.user._id.toString();
        const isParticipant = request.user.toString() === req.user._id.toString();
        if (!isProvider && !isParticipant) return res.status(403).json({ message: "Not authorized" });

        const senderRole = isProvider ? "provider" : "participant";
        request.messages.push({ senderRole, text: text.trim(), sentAt: new Date() });

        // keep providerNote in sync so existing UI references still work
        if (isProvider) request.providerNote = text.trim();

        await request.save();

        const populated = await ServiceRequest.findById(request._id)
            .populate("user", "firstName lastName email")
            .populate("provider", "firstName lastName email")
            .populate("listing", "title category price")
            .populate("contract");

        const recipientId = isProvider ? request.user : request.provider;
        const senderName = isProvider ? populated.provider?.firstName : populated.user?.firstName;
        await notify(
            recipientId,
            isProvider ? "New Message from Provider 💬" : "New Reply from Participant 💬",
            `${senderName} sent a message regarding "${populated.listing?.title}"`,
            "request"
        );

        res.json(populated);
    } catch (err) {
        console.error("Error sending message:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Provider sends a note/message before accepting or declining (kept for backward compat)
exports.respondToRequest = async (req, res) => {
    try {
        const { providerNote } = req.body;

        const request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found" });

        if (request.provider.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (request.status !== "pending") {
            return res.status(400).json({ message: "Can only respond to pending requests" });
        }

        request.providerNote = providerNote || "";
        request.messages.push({ senderRole: "provider", text: providerNote || "", sentAt: new Date() });
        await request.save();

        const populated = await ServiceRequest.findById(request._id)
            .populate("user", "firstName lastName email")
            .populate("provider", "firstName lastName email")
            .populate("listing", "title category price")
            .populate("contract");

        await notify(
            request.user,
            "Provider Responded to Your Request 💬",
            `${populated.provider?.firstName} left a message on your request for "${populated.listing?.title}"`,
            "request"
        );

        res.json(populated);
    } catch (err) {
        console.error("Error responding to request:", err);
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

            const answersSection = request.formAnswers && request.formAnswers.length > 0
                ? `\nSERVICE DETAILS PROVIDED BY CLIENT:\n${request.formAnswers.map(a => `  - ${a.label}: ${a.value}`).join("\n")}\n`
                : "";

            const terms = `SERVICE CONTRACT

This agreement is entered between the Service Provider and the Client for the following service:

Service: ${populated.listing?.title || "N/A"}
Category: ${populated.listing?.category || "N/A"}
Location: ${populated.listing?.location || "N/A"}
Agreed Price: ${finalPrice || populated.listing?.price || "N/A"} TND
Event Date: ${request.startDate ? new Date(request.startDate).toLocaleDateString() : "To be confirmed"}
${answersSection}
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
                formAnswers: request.formAnswers || [],
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