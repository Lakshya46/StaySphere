const express = require("express");
const router = express.Router({ mergeParams: true });
const middleware = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");
const bookings = require("../controllers/bookings");

// Create booking
router.post("/", middleware.isLogged, wrapAsync(bookings.createBooking));

// Show booking
router.get("/:bookingId", middleware.isLogged, wrapAsync(bookings.showBooking));

// Cancel booking
router.delete("/:bookingId", middleware.isLogged, wrapAsync(bookings.cancelBooking));

module.exports = router;
