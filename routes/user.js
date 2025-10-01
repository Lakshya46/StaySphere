const express = require("express");
const router = express.Router();
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync");
const middleware = require("../middleware");
const userController = require("../controllers/users");
const User = require("../models/user");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const multer = require("multer");
const { storage } = require("../cloudConfig"); // Cloudinary storage
const upload = multer({ storage });

// ---------------- AUTH ----------------
router.route("/signup")
  .get(userController.renderSignUp)
  .post(wrapAsync(userController.userSignup));

router.route("/login")
  .get(userController.renderLogin)
  .post(
    passport.authenticate("local", { failureRedirect: "/users/login", failureFlash: true }),
    userController.userLogin
  );

router.get("/logout", userController.userLogout);

// ---------------- PROFILE ----------------
router.get("/profile", middleware.isLogged, wrapAsync(userController.renderProfile));
router.get("/profile/edit", middleware.isLogged, wrapAsync(userController.renderEditProfile));
router.post(
  "/profile/edit",
  middleware.isLogged,
  upload.single("profilePic"),
  wrapAsync(userController.updateProfile)
);

// ---------------- GUEST ACTIONS ----------------

// Wishlist
router.get("/guest/wishlist", middleware.isLogged, async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");
  res.render("users/wishlist", { user, wishlist: user.wishlist });
});

// Toggle favorite
router.post("/guest/favorites/:listingId/toggle", middleware.isLogged, userController.toggleFavorite);

// Upcoming Stays
router.get("/guest/bookings/upcoming", middleware.isLogged, wrapAsync(async (req, res) => {
  const bookings = await Booking.find({ 
    user: req.user._id,
    endDate: { $gte: new Date() }
  }).populate("listing");
  res.render("users/guestUpcomingBookings", { bookings });
}));

// Booking History (confirmed & canceled)
router.get("/guest/bookings/history", middleware.isLogged, wrapAsync(async (req, res) => {
  const bookings = await Booking.find({ 
    user: req.user._id
  }).populate("listing")
    .sort({ startDate: -1 }); // optional: newest first

  res.render("users/guestBookingHistory", { bookings });
}));



// ---------------- HOST ACTIONS ----------------

// Middleware to check if user is a host
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
router.get("/host/properties", middleware.isLogged, wrapAsync(isHost), async (req, res) => {
  const listings = req.hostListings;
  res.render("users/hostProperties", { listings });
});

// Upcoming Guests
router.get("/host/bookings/upcoming", middleware.isLogged, wrapAsync(isHost), wrapAsync(async (req, res) => {
  const bookings = await Booking.find({ 
    listing: { $in: req.hostListings.map(l => l._id) },
    endDate: { $gte: new Date() }
  }).populate("user listing");
  res.render("users/hostUpcomingBookings", { bookings });
}));

// Past Guests (Confirmed & Canceled)
router.get("/host/bookings/history", middleware.isLogged, wrapAsync(isHost), wrapAsync(async (req, res) => {
  const bookings = await Booking.find({ 
    listing: { $in: req.hostListings.map(l => l._id) },
    endDate: { $lt: new Date() }
  }).populate("user listing");
  res.render("users/hostBookingHistory", { bookings });
}));

module.exports = router;
