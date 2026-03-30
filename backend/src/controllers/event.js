const Event = require("../models/event");

// Create a new event
exports.createEvent = async (req, res) => {
    try {
        const { name } = req.body;
        const event = await Event.create({
            name,
            organizer: req.user._id,
            services: []
        });
        res.status(201).json(event);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all events for the current user
exports.getMyEvents = async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user._id }).populate({
            path: 'services',
            populate: { path: 'organizer', select: 'firstName lastName email' }
        });
        res.json(events);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Add a service to an event
exports.addServiceToEvent = async (req, res) => {
    try {
        const { eventId, serviceId } = req.body;
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (event.organizer.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized" });

        event.services.push(serviceId);
        await event.save();

        const populatedEvent = await Event.findById(eventId).populate({
            path: 'services',
            populate: { path: 'organizer', select: 'firstName lastName email' }
        });
        res.json(populatedEvent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Remove a service from an event
exports.removeServiceFromEvent = async (req, res) => {
    try {
        const { eventId, serviceId } = req.body;
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (event.organizer.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized" });

        event.services = event.services.filter(id => id.toString() !== serviceId);
        await event.save();

        const populatedEvent = await Event.findById(eventId).populate({
            path: 'services',
            populate: { path: 'organizer', select: 'firstName lastName email' }
        });
        res.json(populatedEvent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
