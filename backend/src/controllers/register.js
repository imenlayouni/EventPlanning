const User = require("../models/User");
const { verifyCINWithAI } = require("../services/aiVerif");

exports.registerRequest = async (req, res) => {
  try {
    const { firstName, lastName, email, role } = req.body;

    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    if (!["participant", "organisateur"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "CIN photo required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    //verify CIN before creating the user
    const isCINValid = await verifyCINWithAI(req.file.path);

    if (!isCINValid) {
      return res.status(400).json({ message: "CIN is invalid" });
    }

    //create user only if CIN is valid
    const user = await User.create({
      firstName,
      lastName,
      email,
      role,
      cinPhoto: req.file.path,
      status: "PENDING",
      cinVerified: true
    });

    res.status(201).json({
      message: "Registration request submitted. Await admin validation."
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};