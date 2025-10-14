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
    const { username, email, password, phone, name } = req.body; // include phone and name
    const newUser = new User({ username, email, phone, name });   // save them to DB
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

  const today = new Date();

  // Guest Stats
  const guestBookings = await Booking.find({ user: req.user._id }).populate("listing");
  const upcomingGuest = guestBookings.filter(b => new Date(b.startDate) > today).length;
  const completedGuest = guestBookings.filter(b => new Date(b.startDate) <= today && b.status === "confirmed").length;

  // Host Stats
  const hostListings = await Listing.find({ owner: req.user._id });
  let pendingHostBookings = 0;
  let cancelledHostBookings = 0;
  let upcomingCheckins = 0;
  let totalRevenue = 0;
  const occupancyLabels = [];
  const occupancyData = [];
  const revenueLabels = [];
  const revenueData = [];

  const targetRevenuePerListing = 1000; // you can adjust as needed

  for (let listing of hostListings) {
    const bookings = await Booking.find({ listing: listing._id });

    const pending = bookings.filter(b => b.status === "pending");
    const confirmed = bookings.filter(b => b.status === "confirmed");
    const cancelled = bookings.filter(b => b.status === "cancelled");

    pendingHostBookings += pending.length;
    cancelledHostBookings += cancelled.length;

    // Upcoming check-ins (confirmed bookings with startDate > today)
    upcomingCheckins += confirmed.filter(b => new Date(b.startDate) > today).length;

    // Revenue
    const listingRevenue = confirmed.reduce((sum, b) => sum + b.totalPrice, 0);
    totalRevenue += listingRevenue;

    // Occupancy % (confirmed / total bookings)
    const totalBookings = bookings.length;
    const occupancyPercent = totalBookings ? Math.round((confirmed.length / totalBookings) * 100) : 0;

    occupancyLabels.push(listing.title);
    occupancyData.push(occupancyPercent);

    revenueLabels.push(listing.title);
    revenueData.push(listingRevenue);
  }

  // Pie chart percentages
  const totalBookingsCount = pendingHostBookings + cancelledHostBookings + upcomingCheckins;
  const cancelledPercent = totalBookingsCount ? Math.round((cancelledHostBookings / totalBookingsCount) * 100) : 0;
  const totalRevenuePercent = hostListings.length ? Math.min(Math.round((totalRevenue / (hostListings.length * targetRevenuePerListing)) * 100), 100) : 0;
  const occupancyRate = hostListings.length ? Math.round((upcomingCheckins / (pendingHostBookings + upcomingCheckins + cancelledHostBookings)) * 100) : 0;
  const completedPercent = guestBookings.length ? Math.round((completedGuest / guestBookings.length) * 100) : 0;

  const dashboard = {
    guest: {
      totalBookings: guestBookings.length,
      upcoming: upcomingGuest,
      completed: completedGuest,
      completedPercent
    },
    owner: {
      totalProperties: hostListings.length,
      pendingBookings: pendingHostBookings,
      cancelledBookings: cancelledHostBookings,
      upcomingCheckins,
      totalRevenue,
      totalRevenuePercent,
      occupancyRate,
      revenueLabels,
      revenueData,
      occupancyLabels,
      occupancyData,
      cancelledPercent
    }
  };

  res.render("users/profile", { user, dashboard });
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


module.exports.renderEditProfile = (req, res) => {
  res.render("users/editProfile", { user: req.user });
};
