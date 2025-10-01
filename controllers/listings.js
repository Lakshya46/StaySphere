const Listing = require("../models/listing");
const Booking = require("../models/booking"); // Add Booking model
const Review = require("../models/review");
const ExpressError = require("../utils/ExpressError");
const { listingSchema, reviewSchema } = require("../schema");
const User = require("../models/user");

// -------------------- LISTINGS --------------------

module.exports.index = async (req, res) => {
  const { q, city, area, minPrice, maxPrice, bhkType, amenities } = req.query;
  let query = {};

  if (q) query.title = { $regex: q, $options: "i" };
  if (city) query.city = { $regex: city, $options: "i" };
  if (area) query.area = { $regex: area, $options: "i" };
  if (bhkType) query.bhkType = bhkType;

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (amenities) {
    const amenityArray = Array.isArray(amenities) ? amenities : [amenities];
    query.amenities = { $all: amenityArray };
  }

  const allListing = await Listing.find(query);

  // Pass user wishlist if logged in
  let wishlist = [];
  if (req.user) {
    const user = await User.findById(req.user._id);
    wishlist = user.wishlist.map(id => id.toString());
  }

  res.render("listings/index.ejs", { allListing, query: req.query, wishlist });
};


module.exports.renderNewListingForm = (req, res) => {
  res.render("listings/new.ejs");
};


module.exports.createNewListing = async (req, res) => {
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;

  // Combine city & area into location
  if (req.body.listing.city && req.body.listing.area) {
    newListing.location = `${req.body.listing.city}, ${req.body.listing.area}`;
  }

  // Handle uploaded images
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      if (file.fieldname === "listing[featuredImage]") {
        newListing.featuredImage = { url: file.path, filename: file.filename };
      } else if (file.fieldname === "listing[images]") {
        if (!newListing.images) newListing.images = [];
        newListing.images.push({ url: file.path, filename: file.filename });
      }
    });
  }

  await newListing.save();
  req.flash("success", "New listing created");
  res.redirect("/listings");
};


module.exports.renderShowListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } });

  if (!listing) {
    req.flash("error", "Listing doesn't exist");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};


module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing doesn't exist");
    return res.redirect("/listings");
  }
  res.render("listings/edit.ejs", { listing });
};


module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

  // Update location
  if (req.body.listing.city && req.body.listing.area) {
    listing.location = `${req.body.listing.city}, ${req.body.listing.area}`;
  }

  // Update images
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      if (file.fieldname === "listing[featuredImage]") {
        listing.featuredImage = { url: file.path, filename: file.filename };
      } else if (file.fieldname === "listing[images]") {
        if (!listing.images) listing.images = [];
        listing.images.push({ url: file.path, filename: file.filename });
      }
    });
  }

  await listing.save();
  req.flash("success", "Listing has been updated");
  res.redirect(`/listings/${id}`);
};


module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing has been deleted");
  res.redirect("/listings");
};


// -------------------- AVAILABILITY CALENDAR --------------------
module.exports.getAvailability = async (req, res) => {
  try {
    const listingId = req.params.listingId;

    // Fetch all bookings with pending or confirmed status
    const bookings = await Booking.find({
      listing: listingId,
      status: { $in: ["pending", "confirmed"] }
    });

    console.log("Fetched bookings from DB:", bookings);

    // Map bookings to date ranges using correct field names
    const unavailableDates = bookings
      .filter(b => b.startDate && b.endDate) // filter out invalid dates
      .map(b => ({
        from: b.startDate,
        to: b.endDate
      }));

    console.log("Processed unavailable dates:", unavailableDates);

    res.json(unavailableDates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

