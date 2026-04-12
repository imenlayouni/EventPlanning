const Notification = require("../models/notification");

module.exports = async (userId, title, message, type, link = null) => {
    try {
        await Notification.create({ user: userId, title, message, type, link });
    } catch (err) {
        console.error("Failed to create notification:", err.message);
    }
};