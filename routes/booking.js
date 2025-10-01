const express = require("express");
const router = express.Router({ mergeParams: true });
const middleware = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");
const bookings = require("../controllers/bookings");

// Create a new booking
router.post("/", middleware.isLogged, wrapAsync(bookings.createBooking));

// Show booking details
router.get("/:bookingId", middleware.isLogged, wrapAsync(bookings.showBooking));

// Pay for a booking
router.post("/:bookingId/pay", middleware.isLogged, wrapAsync(bookings.payBooking));

// Cancel a booking
router.delete("/:bookingId", middleware.isLogged, wrapAsync(bookings.cancelBooking));

module.exports = router;
