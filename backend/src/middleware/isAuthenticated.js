const jwt = require("jsonwebtoken"); //decode and verify JWT tokens
const User = require("../models/User");

//async: the code can wait without blocking other operations using await
module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      console.error(`User not found with ID: ${decoded.id}`);
      return res.status(401).json({ message: "User not found" });
    }

    // Ensure user has both _id and id properties for compatibility
    req.user = user;
    req.user.id = user._id;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
};
