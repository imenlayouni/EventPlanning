const express = require("express");
const router = express.Router();
const Reservation = require("../models/reservation");

// Get reservations (booked ranges) for a given listing/service
router.get("/listing/:id", async (req, res) => {
  try {
    const reservations = await Reservation.find({ serviceId: req.params.id, status: { $in: ["pending", "confirmed"] } })
      .select("startDate endDate status");
    res.json(reservations);
  } catch (err) {
    console.error("Error fetching reservations:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
