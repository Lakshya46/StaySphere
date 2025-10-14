const express = require("express");
const router = express.Router();
const passport = require("passport");
const multer = require("multer");

const wrapAsync = require("../utils/wrapAsync");
const middleware = require("../middleware");
const userController = require("../controllers/users");
const { storage } = require("../cloudConfig"); // Cloudinary storage
const upload = multer({ storage });
const Listing = require("../models/listing"); // ADD THIS

// =======================
// AUTH ROUTES
// =======================

// Sign Up
router.route("/signup")
  .get(userController.renderSignUp)
  .post(wrapAsync(userController.userSignup));

// Login
router.route("/login")
  .get(userController.renderLogin)
  .post(
    passport.authenticate("local", { failureRedirect: "/users/login", failureFlash: true }),
    userController.userLogin
  );

// Logout
router.get("/logout", userController.userLogout);

// =======================
// PROFILE ROUTES
// =======================

// User Profile
router.get("/profile", middleware.isLogged, wrapAsync(userController.renderProfile));

// Edit Profile (render page)
router.get("/profile/edit", middleware.isLogged, userController.renderEditProfile);

// Update Profile (submit form)
router.post(
  "/profile/edit",
  middleware.isLogged,
  upload.single("profilePic"),
  wrapAsync(userController.updateProfile)
);

// =======================
// GUEST ACTIONS
// =======================

// Wishlist
router.get("/guest/wishlist", middleware.isLogged, wrapAsync(userController.renderWishlist));

// Toggle Favorite
router.post("/guest/favorites/:listingId/toggle", middleware.isLogged, wrapAsync(userController.toggleFavorite));

// Upcoming Stays
router.get("/guest/bookings/upcoming", middleware.isLogged, wrapAsync(userController.renderGuestUpcomingBookings));

// Booking History
router.get("/guest/bookings/history", middleware.isLogged, wrapAsync(userController.renderGuestBookingHistory));

// =======================
// HOST ACTIONS
// =======================

// Middleware to check if user has host listings
const isHost = async (req, res, next) => {
  const hostListings = await Listing.find({ owner: req.user._id });
  if (!hostListings.length) {
    req.flash("error", "You have no listings yet.");
    return res.redirect("/users/profile");
  }
  req.hostListings = hostListings;
  next();
};

// All Listed Properties
router.get("/host/properties", middleware.isLogged, wrapAsync(isHost), wrapAsync(userController.renderHostProperties));

// Upcoming Guests
router.get("/host/bookings/upcoming", middleware.isLogged, wrapAsync(isHost), wrapAsync(userController.renderHostUpcomingBookings));

// Past Guests
router.get("/host/bookings/history", middleware.isLogged, wrapAsync(isHost), wrapAsync(userController.renderHostBookingHistory));

module.exports = router;
