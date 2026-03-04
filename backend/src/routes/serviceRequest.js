const express = require("express");
const { createRequest, getMyRequests, getProviderRequests, updateRequestStatus } = require("../controllers/serviceRequest");
const requireAuth = require("../middleware/isAuthenticated");

const router = express.Router();

router.use(requireAuth);

router.post("/", createRequest);
router.get("/my", getMyRequests);
router.get("/provider", getProviderRequests);
router.put("/:id/status", updateRequestStatus);

module.exports = router;
