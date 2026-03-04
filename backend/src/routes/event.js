const express = require("express");
const { createEvent, getMyEvents, addServiceToEvent, removeServiceFromEvent } = require("../controllers/event");
const requireAuth = require("../middleware/isAuthenticated");

const router = express.Router();

router.use(requireAuth);

router.post("/", createEvent);
router.get("/my", getMyEvents);
router.post("/add-service", addServiceToEvent);
router.delete("/remove-service", removeServiceFromEvent);

module.exports = router;
