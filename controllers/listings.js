const Listing = require("../models/listing");
const Booking = require("../models/booking"); // Add Booking model
const Review = require("../models/review");
const ExpressError = require("../utils/ExpressError");
const { listingSchema, reviewSchema } = require("../schema");
const User = require("../models/user");

// -------------------- LISTINGS --------------------



module.exports.index = async (req, res) => {
  try {
    const {
      q,
      city,
      area,
      pincode,
      minPrice,
      maxPrice,
      propertyType,
      bhkType,
      amenities,
      nearby,
      lat,
      lng,
      availableFrom,
      availableTo,
    } = req.query;

    let query = {};

    // 🔍 Title / Search
    if (q) query.title = { $regex: q, $options: "i" };

    // 📍 City / Area / Pincode
    if (city) query.city = { $regex: city, $options: "i" };
    if (area) query.area = { $regex: area, $options: "i" };
    if (pincode) query.pincode = pincode;

    // 💰 Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 🏠 Property Type & BHK
    if (propertyType) query.propertyType = propertyType;
    if (propertyType === "Flat" && bhkType) query.bhkType = bhkType;

    // ✅ Amenities
    if (amenities) {
      const amenityArray = Array.isArray(amenities) ? amenities : [amenities];
      query.amenities = { $all: amenityArray };
    }

    // 🗓️ Base query fetch (without availability filtering yet)
    let allListing = await Listing.find(query);

    // 🗓️ Filter by availability date range if provided
   // 🗓️ Filter listings by availability date range
// 🗓️ Filter listings by availability date range
if (availableFrom || availableTo) {
  const from = availableFrom ? new Date(availableFrom) : null;
  const to = availableTo ? new Date(availableTo) : null;

  // Ensure valid date range
  if (from && to && !isNaN(from) && !isNaN(to)) {
    // Find all confirmed bookings that overlap with requested date range
    const overlappingBookings = await Booking.find({
      status: "confirmed", // ✅ Only confirmed bookings
      $or: [
        { startDate: { $lte: to }, endDate: { $gte: from } }, // overlapping dates
      ],
    }).distinct("listing");

    // Convert ObjectIds to strings for safe comparison
    const bookedIds = overlappingBookings.map((id) => id.toString());

    // Exclude listings that are already booked
    allListing = allListing.filter(
      (listing) => !bookedIds.includes(listing._id.toString())
    );
  }
}



    // 📍 Nearby filter using Haversine formula
    if (nearby && lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = 10; // within 10 km

      allListing = allListing.filter((listing) => {
        if (!listing.latitude || !listing.longitude) return false;

        const R = 6371; // Earth radius in km
        const dLat = ((listing.latitude - userLat) * Math.PI) / 180;
        const dLng = ((listing.longitude - userLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(userLat * Math.PI / 180) *
            Math.cos(listing.latitude * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance <= radiusKm;
      });
    }

    // 💖 Wishlist data if user logged in
    let wishlist = [];
    if (req.user) {
      const user = await User.findById(req.user._id);
      wishlist = user.wishlist.map((id) => id.toString());
    }

    // 🚫 No results check
    const noResults = allListing.length === 0;

    res.render("listings/index.ejs", { allListing, query: req.query, wishlist, noResults });
  } catch (err) {
    console.error("Error fetching listings:", err);
    res.status(500).send("Server Error");
  }
};




module.exports.renderNewListingForm = (req, res) => {
  res.render("listings/new.ejs");
};


module.exports.createNewListing = async (req, res) => {
  try {
    const formData = req.body.listing;

    // Create a new listing document
    const newListing = new Listing({
      title: formData.title,
      description: formData.description,
      price: formData.price,
      country: formData.country,
      city: formData.city,
      area: formData.area,
      pincode: formData.pincode,
      propertyType: formData.propertyType,
      additionalInfo: formData.additionalInfo || "",
      amenities: formData.amenities || [],
      latitude: formData.latitude,
      longitude: formData.longitude,
      owner: req.user._id,
    });

    // Add BHK, bedroom, and bathroom logic only if applicable
    if (formData.propertyType === "Flat") {
      newListing.bhkType = formData.bhkType;
      newListing.bedrooms = formData.bedrooms || 0;
      newListing.bathrooms = formData.bathrooms || 0;
    } else if (formData.propertyType === "PG") {
      newListing.bedrooms = formData.bedrooms || 1;
      newListing.bathrooms = formData.bathrooms || 1;
    } else if (formData.propertyType === "Studio") {
      newListing.bhkType = "Studio";
      newListing.bedrooms = 1;
      newListing.bathrooms = 1;
    }

    // Combine city & area for readable location
    if (formData.city && formData.area) {
      newListing.location = `${formData.area}, ${formData.city}`;
    }

    // Handle uploaded images (Cloudinary / Multer)
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

    req.flash("success", "✅ New listing created successfully!");
    res.redirect("/listings");

  } catch (err) {
    console.error("Error creating listing:", err);
    req.flash("error", "❌ Failed to create listing. Please try again.");
    res.redirect("/listings/new");
  }
};

module.exports.renderShowListing = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch listing with owner and reviews (including review authors)
    const listing = await Listing.findById(id)
      .populate("owner", "username email")
      .populate({
        path: "reviews",
        populate: { path: "author", select: "username" },
      });

    if (!listing) {
      req.flash("error", "❌ Listing not found or has been removed.");
      return res.redirect("/listings");
    }

    // Pass the current user for wishlist, review, and ownership checks
    const currentuser = req.user || null;

    // Render page with required data
    res.render("listings/show.ejs", { listing, currentuser });
  } catch (err) {
    console.error("Error rendering listing:", err);
    req.flash("error", "⚠️ Unable to load listing. Please try again later.");
    res.redirect("/listings");
  }
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
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  // Extract fields except images
  const { featuredImage, images, bedrooms, bathrooms, ...otherFields } = req.body.listing;

  // Update propertyType first
  if (otherFields.propertyType) {
    listing.propertyType = otherFields.propertyType;
  }

  // Update other fields
  Object.assign(listing, otherFields);

  // Conditionally update bedrooms & bathrooms
  if (listing.propertyType === "Flat") {
    if (bedrooms !== undefined && bedrooms !== "") listing.bedrooms = bedrooms;
    if (bathrooms !== undefined && bathrooms !== "") listing.bathrooms = bathrooms;
  } else {
    listing.bedrooms = undefined;
    listing.bathrooms = undefined;
  }

  // Update location string
  if (listing.city && listing.area) {
    listing.location = `${listing.city}, ${listing.area}`;
  }

  // Handle image uploads
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      if (file.fieldname === "listing[featuredImage]" && file.path && file.filename) {
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
      status: { $in: [ "confirmed"] }
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

