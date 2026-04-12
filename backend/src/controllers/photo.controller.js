const Photo = require("../models/photo");

exports.getPhotos = async (req, res) => {
  try {
    const { type, category } = req.query;
    // populate event to access category/title when available
    let query = { isDeleted: false };
    if (type) query.type = type.toUpperCase();

    const photos = await Photo.find(query)
      .populate({ path: "event", select: "category title" })
      .populate({ path: "review", select: "_id" })
      .sort({ createdAt: -1 })
      .lean();

    // if category filter passed, filter by populated event.category
    const filtered = category
      ? photos.filter(p => (p.event?.category || "").toLowerCase() === String(category).toLowerCase())
      : photos;

    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch photos" });
  }
};
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No photo uploaded" });

    const { description, category } = req.body;
    const host = req.protocol + '://' + req.get('host');
    const url = `${host}/uploads/${req.file.filename}`;

    const photo = await Photo.create({
      url,
      description: description || '',
      type: "EVENT",
      isDeleted: false
    });

    res.status(201).json(photo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload photo" });
  }
};
