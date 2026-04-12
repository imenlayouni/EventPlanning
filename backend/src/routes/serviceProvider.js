const express = require("express");
const { updateProfile, getDashboardStats } = require("../controllers/serviceProvider");
const requireAuth = require("../middleware/isAuthenticated");
const requireRole = require("../middleware/role");

const router = express.Router();

router.use(requireAuth, requireRole("serviceProvider"));

router.put("/profile", updateProfile);
router.get("/dashboard-stats", getDashboardStats);

module.exports = router;
