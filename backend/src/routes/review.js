const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/isAuthenticated');
const upload = require('../middleware/upload');
const reviewController = require('../controllers/review.controller');

router.post('/', isAuthenticated, upload.single('photo'), reviewController.createReview);
router.get('/', reviewController.listReviews);
router.post('/provider/:providerId', isAuthenticated, upload.single('photo'), reviewController.createProviderReview);
router.get('/provider/:providerId', reviewController.getProviderReviews);

module.exports = router;