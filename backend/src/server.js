require("dotenv").config(); //load varibales from .env
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors"); //allow front and back to communicate


const app = express();

app.use(
  cors({ origin: "http://localhost:5000", credentials: true, })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

connectDB();

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const serviceProviderRoutes = require("./routes/serviceProvider");
const listingRoutes = require("./routes/listing");
const serviceRequestRoutes = require("./routes/serviceRequest");
const eventRoutes = require("./routes/event");
const photoRoutes = require("./routes/photo");
const reviewRoutes = require("./routes/review");
const contactRoutes = require("./routes/contact");
const reservationRoutes = require("./routes/reservation");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/provider", serviceProviderRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/service-requests", serviceRequestRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/reservations", reservationRoutes);


app.get("/", (req, res) => {
  res.send("Axia Event Planner API running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
