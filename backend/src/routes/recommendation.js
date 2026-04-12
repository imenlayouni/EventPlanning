const express = require("express");
const router = express.Router();
const isAuthenticated = require("../middleware/isAuthenticated");
const { getRecommendations } = require("../controllers/recommendation");

router.post("/", isAuthenticated, getRecommendations);

module.exports = router;
