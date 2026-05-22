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

    // filter by photo.category first, fall back to linked event.category
    const filtered = category
      ? photos.filter(p => {
          const cat = (p.category || p.event?.category || "").toLowerCase();
          return cat === String(category).toLowerCase();
        })
      : photos;

    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch photos" });
  }
};
exports.uploadPhoto = async (req, res) => {
  try {
    if (req.user?.role !== 'serviceProvider') {
      return res.status(403).json({ message: "Only service providers can upload photos" });
    }
    if (!req.file) return res.status(400).json({ message: "No photo uploaded" });

    const { description, category } = req.body;
    const host = req.protocol + '://' + req.get('host');
    const url = `${host}/uploads/${req.file.filename}`;

    const photo = await Photo.create({
      url,
      description: description || '',
      category: category || '',
      type: "EVENT",
      isDeleted: false
    });

    res.status(201).json(photo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload photo" });
  }
};

exports.deletePhoto = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can delete photos" });
    }
    const photo = await Photo.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!photo) return res.status(404).json({ message: "Photo not found" });
    res.json({ message: "Photo deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete photo" });
  }
};
