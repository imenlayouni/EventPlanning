const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/isAuthenticated');
const upload = require('../middleware/upload');
const reviewController = require('../controllers/review.controller');

router.post('/', isAuthenticated, upload.single('photo'), reviewController.createReview);
router.get('/', reviewController.listReviews);

module.exports = router;
