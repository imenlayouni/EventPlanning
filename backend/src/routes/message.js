const express = require("express");
const { sendMessage, getMessages, markAsRead } = require("../controllers/message");
const requireAuth = require("../middleware/isAuthenticated");

const router = express.Router();

router.use(requireAuth);

router.post("/", sendMessage);
router.get("/", getMessages);
router.put("/read", markAsRead);

module.exports = router;
