const express = require("express");
const { createRequest, getMyRequests, getProviderRequests, updateRequestStatus, respondToRequest, sendMessage } = require("../controllers/serviceRequest");
const requireAuth = require("../middleware/isAuthenticated");

const router = express.Router();

router.use(requireAuth);

router.post("/", createRequest);
router.get("/my", getMyRequests);
router.get("/provider", getProviderRequests);
router.put("/:id/respond", respondToRequest);
router.post("/:id/message", sendMessage);
router.put("/:id/status", updateRequestStatus);

module.exports = router;
