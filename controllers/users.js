const User = require("../models/user");
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const otpGenerator = require("otp-generator");
const sendMail = require("../config/Mail.js")

// =======================
// AUTH
// =======================
module.exports.renderSignUp = (req, res) => {
  res.render("users/signup");
};

module.exports.userSignup = async (req, res, next) => {
  try {
    const { username, email, password, phone, name } = req.body;

    // 🔹 Check existing email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      req.flash("error", "Email already exists");
      return res.redirect("/users/signup");
    }

    // 🔹 Check existing username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      req.flash("error", "Username already exists");
      return res.redirect("/users/signup");
    }

    // 🔹 Password length check
    if (!password || password.length < 6) {
      req.flash("error", "Password must be at least 6 characters long");
      return res.redirect("/users/signup");
    }

    // 1️⃣ Generate OTP (numeric only)
const otp = otpGenerator.generate(6, {
  digits: true,
  lowerCaseAlphabets: false,
  upperCaseAlphabets: false,
  specialChars: false,
});


    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 mins

    // 2️⃣ Save data temporarily in session
    req.session.tempUser = {
      username,
      email,
      name,
      phone,
      password,
      otp,
      otpExpiry,
    };

    // 3️⃣ Send OTP (email or SMS)
    console.log("Signup OTP:", otp);
    await sendMail(email, otp);

    req.flash("success", "OTP sent to your email");
    return res.redirect("/users/verify-otp");

  } catch (err) {
    console.error(err);
    req.flash("error", "Signup failed. Please try again.");
    return res.redirect("/users/signup");
  }
};


// =============================
// RENDER OTP PAGE
// =============================
module.exports.renderOtpPage = (req, res) => {
  if (!req.session.tempUser) {
    req.flash("error", "Session expired. Please signup again.");
    return res.redirect("/users/signup");
  }
  res.render("users/verifyOtp");
};


// =============================
// STEP 2 → VERIFY OTP → CREATE USER
// =============================
module.exports.verifyOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;

    if (!req.session.tempUser) {
      req.flash("error", "Session expired. Please signup again.");
      return res.redirect("/users/signup");
    }

    const temp = req.session.tempUser;

    // 🔹 Wrong OTP
    if (otp !== temp.otp) {
      req.flash("error", "Invalid OTP. Try again.");
      return res.redirect("/users/verify-otp");
    }

    // 🔹 OTP expired
    if (Date.now() > temp.otpExpiry) {
      req.flash("error", "OTP expired. Please signup again.");
      return res.redirect("/users/signup");
    }

    // 3️⃣ OTP verified → create real user
    const newUser = new User({
      username: temp.username,
      email: temp.email,
      phone: temp.phone,
      name: temp.name,
    });

    const registeredUser = await User.register(newUser, temp.password);

    // 4️⃣ Clear temporary signup data
    req.session.tempUser = null;

    // 5️⃣ Auto login
    req.login(registeredUser, (err) => {
      if (err) return next(err);

      req.flash("success", "Account created successfully!");
      return res.redirect("/listings");
    });

  } catch (err) {
    console.error(err);
    req.flash("error", "OTP verification failed. Try again.");
    return res.redirect("/users/verify-otp");
  }
};


module.exports.resendOtp = async (req, res) => {
  try {
    if (!req.session.tempUser) {
      req.flash("error", "Session expired. Please signup again.");
      return res.redirect("/users/signup");
    }

    // Generate new OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    // Update OTP & expiry
    req.session.tempUser.otp = otp;
    req.session.tempUser.otpExpiry = Date.now() + 5 * 60 * 1000;

    // Send email
    await sendMail(req.session.tempUser.email, otp);

    console.log("Resent OTP:", otp);

    req.flash("success", "A new OTP has been sent to your email.");
    return res.redirect("/users/verify-otp");

  } catch (err) {
    console.error(err);
    req.flash("error", "Could not resend OTP. Try again.");
    return res.redirect("/users/verify-otp");
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


module.exports.renderWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    const wishlist = user.wishlist || []; // send as wishlist
    res.render("users/wishlist", { wishlist });
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to load wishlist");
    res.redirect("/users/profile");
  }
};


module.exports.renderHostProperties = async (req, res) => {
  const listings = await Listing.find({ owner: req.user._id });
  res.render("users/hostProperties", { listings });
};

module.exports.renderHostUpcomingBookings = async (req, res) => {
  try {
    const today = new Date();
    let upcomingBookings = [];

    // Loop through all host listings
    for (let listing of req.hostListings) {
      const bookings = await Booking.find({ listing: listing._id, status: "confirmed" })
        .populate("user")
        .populate("listing");

      const upcoming = bookings.filter(b => new Date(b.startDate) > today);
      upcomingBookings.push(...upcoming);
    }

    // Sort by start date ascending
    upcomingBookings.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    res.render("users/hostUpcomingBookings", { bookings: upcomingBookings });
  } catch (err) {
    console.error(err);
    req.flash("error", "Could not fetch upcoming bookings");
    res.redirect("/users/profile");
  }
};



module.exports.renderHostBookingHistory = async (req, res) => {
  try {
    const today = new Date();

    // req.hostListings is set by the isHost middleware
    const hostListingIds = req.hostListings.map(listing => listing._id);

    // Fetch bookings for all host listings that are past (startDate <= today or cancelled)
    const bookings = await Booking.find({ listing: { $in: hostListingIds } })
      .populate("listing")
      .populate("user") // guest info
      .sort({ startDate: -1 });

    // Only past bookings (completed or cancelled)
    const pastBookings = bookings.filter(b => new Date(b.startDate) <= today || b.status === "cancelled");

    res.render("users/hostBookingHistory", { bookings: pastBookings });
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to load past guest bookings");
    res.redirect("/users/profile");
  }
};

module.exports.renderGuestUpcomingBookings = async (req, res) => {
  try {
    const today = new Date();

    // Fetch bookings for the logged-in guest with startDate in the future
    const bookings = await Booking.find({ user: req.user._id, status: { $in: ["pending", "confirmed"] } })
      .populate("listing")
      .sort({ startDate: 1 }); // earliest upcoming first

    const upcomingBookings = bookings.filter(b => new Date(b.startDate) > today);

    res.render("users/guestUpcomingBookings", { bookings: upcomingBookings });
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to load upcoming bookings");
    res.redirect("/users/profile");
  }
};

// Guest Booking History
module.exports.renderGuestBookingHistory = async (req, res) => {
  try {
    const today = new Date();

    // Fetch all bookings for the logged-in guest
    const bookings = await Booking.find({ user: req.user._id })
      .populate("listing")
      .sort({ startDate: -1 });

    // Only past bookings (completed or cancelled)
    const pastBookings = bookings.filter(b => new Date(b.startDate) <= today || b.status === "cancelled");

    res.render("users/guestBookingHistory", { bookings: pastBookings });
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to load booking history");
    res.redirect("/users/profile");
  }
};
