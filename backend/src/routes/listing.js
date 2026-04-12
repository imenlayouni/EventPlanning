const express = require("express");
const {createListing,updateListing,deleteListing,getListings,getListingById} = require("../controllers/listing");
const requireAuth = require("../middleware/isAuthenticated");
const requireRole = require("../middleware/role");

const router = express.Router();

//public routes(Feed)
router.get("/", getListings);
router.get("/:id", getListingById);

const upload = require("../middleware/upload");

//protected routes(Organizer)
router.post("/", requireAuth, requireRole("serviceProvider"), upload.array("images", 5), createListing);
router.put("/:id", requireAuth, requireRole("serviceProvider"), upload.array("images", 5), updateListing);
router.delete("/:id", requireAuth, requireRole("serviceProvider"), deleteListing);

module.exports = router;
