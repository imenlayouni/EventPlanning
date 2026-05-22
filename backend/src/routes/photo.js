const express = require("express");
const router = express.Router();
const photoController = require("../controllers/photo.controller");
const isAuthenticated = require("../middleware/isAuthenticated");
const upload = require("../middleware/upload");

router.get("/", photoController.getPhotos);
router.post("/", isAuthenticated, upload.single("photo"), photoController.uploadPhoto);
router.delete("/:id", isAuthenticated, photoController.deletePhoto);

module.exports = router;