const User = require("../models/user");
const Booking = require("../models/booking");
const Listing = require("../models/listing");

// =======================
// AUTH
// =======================
module.exports.renderSignUp = (req, res) => {
  res.render("users/signup");
};

module.exports.userSignup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (e) => {
      if (e) return next(e);
      req.flash("success", "Successfully registered");
      res.redirect("/listings");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/users/signup");
  }
};

module.exports.renderLogin = (req, res) => {
  res.render("users/login");
};

module.exports.userLogin = async (req, res) => {
  req.flash("success", "Welcome to Stay Sphere");
  const redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

module.exports.userLogout = (req, res, next) => {
  // First set flash
  req.flash("success", "Logged out successfully");

  // Then logout
  req.logout(err => {
    if (err) return next(err);

    // Destroy session
    req.session.destroy(err => {
      if (err) return next(err);
      res.clearCookie('connect.sid'); // remove cookie
      res.redirect("/listings");
    });
  });
};



// =======================
// PROFILE
// =======================
module.exports.renderProfile = async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");

  // Guest Stats
  const guestBookings = await Booking.find({ user: req.user._id }).populate("listing");
  const upcomingGuest = guestBookings.filter(b => new Date(b.startDate) > new Date()).length;
  const completedGuest = guestBookings.filter(b => new Date(b.startDate) <= new Date()).length;

  // Host Stats
  const hostListings = await Listing.find({ owner: req.user._id });
  let pendingHostBookings = 0;
  let totalRevenue = 0;

  for (let listing of hostListings) {
    const pending = await Booking.find({ listing: listing._id, status: "pending" });
    const confirmed = await Booking.find({ listing: listing._id, status: "confirmed" });

    pendingHostBookings += pending.length;
    totalRevenue += confirmed.reduce((sum, b) => sum + b.totalPrice, 0);
  }

  const dashboard = {
    guest: {
      totalBookings: guestBookings.length,
      upcoming: upcomingGuest,
      completed: completedGuest
    },
    owner: {
      totalProperties: hostListings.length,
      pendingBookings: pendingHostBookings,
      totalRevenue,
      pendingBookingsPercent: guestBookings.length
        ? Math.round((pendingHostBookings / guestBookings.length) * 100)
        : 0,
      occupancyRate: hostListings.length ? Math.round((totalRevenue / (hostListings.length * 1000)) * 100) : 50, // example
      revenueLabels: [], // add labels if using charts
      revenueData: [],
      occupancyLabels: [],
      occupancyData: []
    }
  };

  res.render("users/profile", { user, dashboard });
};

module.exports.renderEditProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.render("users/editProfile", { user });
};

module.exports.updateProfile = async (req, res) => {
  try {
    const { email, bio } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/users/profile");
    }

    // Update avatar if a file was uploaded
    if (req.file && req.file.path) {
      user.avatar = req.file.path; // multer + Cloudinary sets file.path to the URL
    }

    user.email = email || user.email;
    user.bio = bio || user.bio;

    await user.save();
    req.flash("success", "Profile updated successfully!");
    res.redirect("/users/profile");
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong while updating profile.");
    res.redirect("/users/profile/edit");
  }
};

// =======================
// HOST ROUTES
// =======================

// Pending bookings awaiting host confirmation


// Upcoming check-ins for host


// All bookings for a specific property


// =======================
// FAVORITES / WISHLIST
// =======================
module.exports.toggleFavorite = async (req, res) => {
  const user = await User.findById(req.user._id);
  const listingId = req.params.listingId;

  let added;
  if(user.wishlist.includes(listingId)){
    // Remove
    user.wishlist = user.wishlist.filter(fav => fav.toString() !== listingId);
    added = false;
  } else {
    if(user.wishlist.length >= 10)
      return res.status(400).json({ success: false, message: "Maximum 10 favorites allowed" });
    
    user.wishlist.push(listingId);
    added = true;
  }

  await user.save();
  res.json({ success: true, added });
};

