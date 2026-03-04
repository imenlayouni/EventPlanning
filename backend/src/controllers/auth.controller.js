const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { verifyCINWithAI } = require("../services/aiVerif");

//register user
exports.registerRequest = async (req, res) => {
  try {
    const { firstName, lastName, email, role, location, assets } = req.body;

    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    if (!["participant", "organisateur"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "CIN photo required" });
    }

    //check email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    //verify CIN before creating user
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
      cinVerified: true,
      location,
      assets
    });

    res.status(201).json({
      message: "Registration request submitted. Await admin validation."
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

//login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("Login failed: Missing email or password");
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase();
    console.log(`Login attempt for: ${normalizedEmail}`);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log("Login failed: User not found");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log(`User found: ${user.email}, Status: ${user.status}`);

    if (user.status !== "ACTIVE") {
      console.log("Login failed: Account not active");
      return res.status(403).json({ message: "Account not validated yet" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log("Login failed: Password mismatch");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      token,
      role: user.role,
      name: `${user.firstName} ${user.lastName}`,
      id: user._id
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

// update user profile (participant) - supports changing password
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { firstName, lastName, location, email, assets, password } = req.body;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (location) user.location = location;
    if (email) user.email = email;
    if (assets) user.assets = assets;
    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      location: user.location
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};