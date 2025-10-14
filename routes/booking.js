const express = require("express");
const router = express.Router({ mergeParams: true });
const middleware = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");
const bookings = require("../controllers/bookings");

// Create a new booking
router.post("/", middleware.isLogged, wrapAsync(bookings.createBooking));

// Show booking details
router.get("/:bookingId", middleware.isLogged, wrapAsync(bookings.showBooking));

// Pay for a booking (simulate)
router.post("/:bookingId/pay", middleware.isLogged, wrapAsync(bookings.payBooking));

// Razorpay order creation
router.post("/:bookingId/razorpay-order", middleware.isLogged, wrapAsync(bookings.createRazorpayOrder));

// Razorpay payment verification
router.post("/:bookingId/verify-payment", middleware.isLogged, wrapAsync(bookings.verifyPayment));

// Cancel a booking
router.delete("/:bookingId", middleware.isLogged, wrapAsync(bookings.cancelBooking));

module.exports = router;
