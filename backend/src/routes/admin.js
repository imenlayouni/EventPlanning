const express = require("express");
const { validateAccount, getAllUsers, updateUserRole, updateUserStatus, getAnalytics, rejectAccount, approveListing, rejectListing, approveService, rejectService, getPendingRequests, getServiceRequests, updateServiceRequestStatus } = require("../controllers/admin");
const requireAuth = require("../middleware/isAuthenticated");
const requireRole = require("../middleware/role");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

//user management
router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", updateUserStatus);
router.post("/validate/:id", validateAccount);
router.post("/reject/:id", rejectAccount);

// Listing approval
router.post("/listings/:id/approve", approveListing);
router.post("/listings/:id/reject", rejectListing);

// Service approval
router.post("/services/:id/approve", approveService);
router.post("/services/:id/reject", rejectService);

// Pending requests listing
router.get("/pending-requests", getPendingRequests);

// Service requests (admin)
router.get("/service-requests", getServiceRequests);
router.patch("/service-requests/:id/status", updateServiceRequestStatus);

//analytics
router.get("/analytics", getAnalytics);

module.exports = router;
