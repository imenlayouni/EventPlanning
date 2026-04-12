const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Listing = require("../models/Listing");
const ServiceRequest = require("../models/ServiceRequest");
const sendMail = require("../services/mail");
const notify = require("../services/notify");

// Get pending listings for admin review
exports.getPendingRequests = async (req, res) => {
  try {
    const pendingListings = await Listing.find({ approved: false }).populate("organizer", "firstName lastName email");
    res.json({ listings: pendingListings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: get service requests
exports.getServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find().populate("user", "firstName lastName email").populate("provider", "firstName lastName email").populate("listing", "title category price").sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: update service request status
exports.updateServiceRequestStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const reqId = req.params.id;

    const request = await ServiceRequest.findById(reqId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = status;
    if (adminNote) request.providerNote = adminNote;
    await request.save();

    const populated = await ServiceRequest.findById(request._id).populate("user", "firstName lastName email").populate("provider", "firstName lastName email").populate("listing", "title category price");

    // optional: notify both parties
    if (populated.user && populated.user.email) {
      await sendMail(populated.user.email, `Your request was ${status}`, `Hello ${populated.user.firstName || ''},\n\nYour request regarding \"${populated.listing?.title}\" has been ${status}.`);
    }
    if (populated.provider && populated.provider.email) {
      await sendMail(populated.provider.email, `A request was ${status}`, `Hello ${populated.provider.firstName || ''},\n\nA request for your listing \"${populated.listing?.title}\" has been ${status}.`);
    }

    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//all users with search,filter,sort
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, status, sort } = req.query;
    let query = {};

    //search by name or email
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    //filter by role
    if (role && role !== "all") {
      query.role = role;
    }

    //filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    //sort
    let sortOption = { createdAt: -1 }; //default by newest
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "name") sortOption = { firstName: 1 };

    const users = await User.find(query).select("-passwordHash").sort(sortOption);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//update user role(promote/demote)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();

    res.json({ message: `User role updated to ${role}`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//update user status(ban/suspend/activate)
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = status;
    await user.save();

    //optional:send email notification
    if (status === "BANNED" || status === "SUSPENDED") {
      await sendMail(user.email, "Account Status Update", `Your account has been ${status.toLowerCase()}.`);
    } else if (status === "ACTIVE") {
      await sendMail(user.email, "Account Activated", "Your account is now active.");
    }

    res.json({ message: `User status updated to ${status}`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//get analytics
exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalListings = await Listing.countDocuments();

    //listings per month(last 6 months)
    const listingsPerMonth = await Listing.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    //top organizers by listing count
    const topOrganizers = await Listing.aggregate([
      { $group: { _id: "$organizer", listingCount: { $sum: 1 } } },
      { $sort: { listingCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "organizer"
        }
      },
      { $unwind: "$organizer" },
      {
        $project: {
          name: { $concat: ["$organizer.firstName", " ", "$organizer.lastName"] },
          listingCount: 1
        }
      }
    ]);

    res.json({ totalUsers, totalListings, listingsPerMonth, topOrganizers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//validate account(approve user)
exports.validateAccount = async (req, res) => {
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (!user.cinVerified) {
    return res.status(400).json({ message: "CIN not verified" });
  }

  if (user.status === "ACTIVE") {
    return res.status(400).json({ message: "Account already validated" });
  };

  const password = Math.random().toString(36).slice(-8);

  user.passwordHash = await bcrypt.hash(password, 10);
  user.status = "ACTIVE";
  await user.save();
  await notify(user._id, "Account Approved! ✅", "Your account has been approved. You can now login.", "account");
  try {
    await sendMail(user.email, "Account validated", `Your password is: ${password}`);
  } catch (mailErr) {
    console.error("Email send failed:", mailErr.message);
  }

  res.json({ message: "Account validated and email sent" });
};

//reject account
exports.rejectAccount = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.status === "REJECTED") {
      return res.status(400).json({ message: "Account already rejected" });
    }

    user.status = "REJECTED";
    await user.save();
    await notify(user._id, "Account Rejected", "Your account application has been rejected.", "account");

    await sendMail(
      user.email,
      "Account Application Update",
      "We regret to inform you that your account application has been rejected."
    );

    res.json({ message: "Account rejected and email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve a listing (publish)
exports.approveListing = async (req, res) => {
  try {
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId).populate("organizer", "email firstName lastName");
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.approved) return res.status(400).json({ message: "Listing already approved" });

    listing.approved = true;
    await listing.save();

    if (listing.organizer && listing.organizer.email) {
      await sendMail(
        listing.organizer.email,
        "Your listing was approved",
        `Hello ${listing.organizer.firstName || ''},\n\nYour listing \"${listing.title}\" has been approved and is now public.`
      );
    }

    res.json({ message: "Listing approved", listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Reject a listing (do not publish)
exports.rejectListing = async (req, res) => {
  try {
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId).populate("organizer", "email firstName lastName");
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.approved === false) {
      // optionally mark as rejected by adding a field, but keep simple: leave approved false
    }

    // send rejection email
    if (listing.organizer && listing.organizer.email) {
      await sendMail(
        listing.organizer.email,
        "Your listing was rejected",
        `Hello ${listing.organizer.firstName || ''},\n\nWe reviewed your listing \"${listing.title}\" and it was not approved for publishing.`
      );
    }

    res.json({ message: "Listing rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

