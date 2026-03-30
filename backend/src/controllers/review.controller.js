const Review = require("../models/review");
const Photo = require("../models/photo");

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
