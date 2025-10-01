const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const middleware = require("../middleware");
const listingController = require("../controllers/listings");
const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });

// ---------- LISTING ROUTES ---------- //

// Index route
router.get("/", wrapAsync(listingController.index));

// New route
router.get("/new", middleware.isLogged, listingController.renderNewListingForm);

// Create route
router.post(
  "/",
  middleware.isLogged,
  middleware.validateListing,
  upload.any(),
  wrapAsync(listingController.createNewListing)
);

// ---------- AVAILABILITY ROUTE ---------- //
// Must be before '/:id' to avoid route conflicts
router.get("/:listingId/availability", wrapAsync(listingController.getAvailability));

// Show route
router.get("/:id", wrapAsync(listingController.renderShowListing));

// Edit route
router.get("/:id/edit", middleware.isLogged, middleware.isOwner, wrapAsync(listingController.renderEditForm));

// Update route
router.put(
  "/:id",
  middleware.isLogged,
  middleware.isOwner,
  upload.any(),
  middleware.validateListing,
  wrapAsync(listingController.updateListing)
);

// Delete route
router.delete("/:id", middleware.isLogged, middleware.isOwner, wrapAsync(listingController.destroyListing));

module.exports = router;
