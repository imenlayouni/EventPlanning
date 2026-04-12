const express = require("express");
const router = express.Router();
const isAuthenticated = require("../middleware/isAuthenticated");
const Notification = require("../models/notification");

// get my notifications
router.get("/", isAuthenticated, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// mark all as read
router.put("/read-all", isAuthenticated, async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
        res.json({ message: "All marked as read" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// mark one as read
router.put("/:id/read", isAuthenticated, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ message: "Marked as read" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;