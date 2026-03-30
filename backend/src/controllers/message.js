const mongoose = require("mongoose");
const Message = require("../models/Message");

exports.sendMessage = async (req, res) => {
    try {
        const { recipient, event, listing, content } = req.body;

        console.log("[sendMessage] req.user._id:", req.user._id, "typeof:", typeof req.user._id);
        console.log("[sendMessage] recipient:", recipient, "typeof:", typeof recipient);
        console.log("[sendMessage] content:", content);

        const message = await Message.create({
            sender: req.user._id,
            recipient,
            event,
            listing,
            content
        });

        console.log("[sendMessage] Created message._id:", message._id);

        const populatedMessage = await Message.findById(message._id)
            .populate("sender", "firstName lastName email")
            .populate("recipient", "firstName lastName email");

        console.log("[sendMessage] populatedMessage:", JSON.stringify(populatedMessage));

        res.status(201).json(populatedMessage);
    } catch (err) {
        console.error("Error in sendMessage:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const { otherUser } = req.query;

        console.log("[getMessages] userId:", userId, "typeof:", typeof userId);
        console.log("[getMessages] otherUser:", otherUser);

        // Ensure userId is an ObjectId for the query
        const userObjectId = new mongoose.Types.ObjectId(userId);

        let query = {
            $or: [{ sender: userObjectId }, { recipient: userObjectId }]
        };

        if (otherUser && otherUser !== "undefined" && otherUser !== "null") {
            const otherUserObjectId = new mongoose.Types.ObjectId(otherUser);
            query = {
                $or: [
                    { sender: userObjectId, recipient: otherUserObjectId },
                    { sender: otherUserObjectId, recipient: userObjectId }
                ]
            };
        }

        console.log("[getMessages] query:", JSON.stringify(query));

        const messages = await Message.find(query)
            .populate("sender", "firstName lastName email")
            .populate("recipient", "firstName lastName email")
            .sort({ createdAt: 1 });

        console.log("[getMessages] Found", messages.length, "messages");

        res.json(messages);
    } catch (err) {
        console.error("Error in getMessages:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await Message.updateMany(
            { recipient: req.user._id, sender: req.body.sender, read: false },
            { read: true }
        );
        res.json({ message: "Messages marked as read" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
