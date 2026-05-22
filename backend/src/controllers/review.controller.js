const Review = require("../models/review");
const Photo = require("../models/photo");
const User = require("../models/User");

// create a review (optional photo)
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user && (req.user._id || req.user.id);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const review = await Review.create({ rating: Number(rating) || 0, comment, user: userId });

    // if file uploaded, create Photo entry linked to this review
    if (req.file) {
      const host = req.protocol + '://' + req.get('host');
      const url = `${host}/uploads/${req.file.filename}`;
      await Photo.create({ url, description: comment || 'Review photo', type: 'REVIEW', review: review._id });
    }

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create review' });
  }
};

// list recent reviews
exports.listReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isDeleted: false }).populate('user', 'firstName lastName').sort({ createdAt: -1 });
    
    // populate photos for each review
    const reviewsWithPhotos = await Promise.all(
      reviews.map(async (review) => {
        const photo = await Photo.findOne({ type: 'REVIEW', review: review._id });
        return {
          ...review.toObject(),
          photo: photo ? { url: photo.url, _id: photo._id } : null
        };
      })
    );
    
    res.json(reviewsWithPhotos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};
exports.createProviderReview = async (req, res) => {
  try {
    const { rating, comment, listingId } = req.body;
    const userId = req.user._id || req.user.id;
    const providerId = req.params.providerId;

    const review = await Review.create({
      rating: Number(rating) || 0,
      comment,
      user: userId,
      provider: providerId,
      listing: listingId || null
    });

    // update provider average rating
    const allReviews = await Review.find({ provider: providerId, isDeleted: false });
    const avg = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
    await User.findByIdAndUpdate(providerId, {
      'serviceProfile.averageRating': Math.round(avg * 10) / 10,
      'serviceProfile.reviewCount': allReviews.length
    });

    const populated = await Review.findById(review._id).populate('user', 'firstName lastName');
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create review' });
  }
};

exports.getProviderReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      provider: req.params.providerId,
      isDeleted: false
    })
      .populate('user', 'firstName lastName')
      .populate('listing', 'title')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

// Admin: get all reviews
exports.adminListReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isDeleted: false })
      .populate('user', 'firstName lastName email')
      .populate('provider', 'firstName lastName')
      .populate('listing', 'title')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

// Admin: delete (soft-delete) a review
exports.adminDeleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    review.isDeleted = true;
    await review.save();
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete review' });
  }
};
