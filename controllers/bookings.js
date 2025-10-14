const Booking = require("../models/booking");
const Listing = require("../models/listing");

const razorpay = require("../utils/razorpay");
// =======================
// Create a booking
// =======================
module.exports.createBooking = async (req, res) => {
    const { id } = req.params;   // Listing ID
    const { checkIn, checkOut, guests } = req.body;

    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000*60*60*24));
    if (nights <= 0) {
        req.flash("error", "Invalid booking dates!");
        return res.redirect(`/listings/${id}`);
    }

    if (!guests || guests <= 0) {
        req.flash("error", "Please select number of guests!");
        return res.redirect(`/listings/${id}`);
    }

    const conflict = await Booking.findOne({
        listing: listing._id,
        status: "confirmed",
        $or: [
            { startDate: { $lt: checkOut, $gte: checkIn } },
            { endDate: { $gt: checkIn, $lte: checkOut } },
            { startDate: { $lte: checkIn }, endDate: { $gte: checkOut } }
        ]
    });

    if (conflict) {
        req.flash("error", "This listing is already booked for the selected dates!");
        return res.redirect(`/listings/${id}`);
    }

    const totalPrice = listing.price * nights;

    // Create booking with status "pending"
    const booking = new Booking({
        listing: listing._id,
        user: req.user._id,
        startDate: checkIn,
        endDate: checkOut,
        guests,
        totalPrice,
        status: "pending"
    });

    await booking.save();

    req.flash("success", "Booking created! Please complete payment to confirm.");
    res.redirect(`/listings/${id}/booking/${booking._id}`);
};
// =======================
// Show booking details
// =======================
module.exports.showBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId)
        .populate({
            path: "listing",
            populate: { path: "owner" }  // <-- populate owner inside listing
        })
        .populate("user");

    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/listings");
    }

    res.render("booking/show", { booking  , currentUser: req.user });
};




// Generate payment order
module.exports.createRazorpayOrder = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate("listing");
    if (!booking) return res.status(404).send("Booking not found");

    // MOCK order (no Razorpay account needed)
    const order = {
      id: "order_test_123", // mock order ID
      amount: booking.totalPrice * 100,
      currency: "INR",
      receipt: `booking_${booking._id}`,
    };

    res.json({ order, booking });
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({ error: "Failed to create payment order", details: err.message });
  }
};

// =======================
// Verify payment (mock)
// =======================
module.exports.verifyPayment = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).send("Booking not found");

  // MARK AS CONFIRMED
  booking.status = "confirmed";
  await booking.save();

  res.json({ success: true, message: "Booking confirmed!" });
};

// Simulate payment success
module.exports.payBooking = async (req, res) => {
    const { id, bookingId } = req.params; // id = listingId

    const booking = await Booking.findById(bookingId).populate("listing");
    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/listings");
    }

    // Ensure logged-in user owns this booking
    if (!booking.user.equals(req.user._id)) {
        req.flash("error", "You are not authorized to pay for this booking!");
        return res.redirect(`/listings/${id}/booking/${bookingId}`);
    }

    if (booking.status === "confirmed") {
        req.flash("info", "Booking is already confirmed.");
        return res.redirect(`/listings/${id}/booking/${bookingId}`);
    }

    // Simulate payment
    booking.status = "confirmed";
    await booking.save();

    req.flash("success", "Payment successful! Booking confirmed.");
    res.redirect(`/listings/${id}/booking/${bookingId}`);
};

// =======================
// Cancel a booking
// =======================
module.exports.cancelBooking = async (req, res) => {
    const { id, bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect(`/listings/${id}`);
    }

    // Ensure booking belongs to logged-in user
    if (!booking.user.equals(req.user._id)) {
        req.flash("error", "You are not authorized to cancel this booking!");
        return res.redirect(`/listings/${id}/booking/${bookingId}`);
    }

    // Update status to cancelled
    booking.status = "cancelled";
    await booking.save();

    req.flash("success", "Booking cancelled successfully!");
    res.redirect(`/listings/${id}`);
};
