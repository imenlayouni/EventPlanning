const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const upload = require("../middleware/upload");
const isAuthenticated = require("../middleware/isAuthenticated");

router.post("/register", upload.single("cinPhoto"), authController.registerRequest);

router.post("/login",authController.login);
router.put('/profile', isAuthenticated, authController.updateProfile);

module.exports = router;
