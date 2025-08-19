const Booking = require("../models/booking");
const Listing = require("../models/listing");

// =======================
// Create a booking
// =======================
module.exports.createBooking = async (req, res) => {
    const { id } = req.params;   // Listing ID
    const { checkIn, checkOut, guests } = req.body;

    // Find listing
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // Calculate nights
    const nights = Math.ceil(
        (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );
    if (nights <= 0) {
        req.flash("error", "Invalid booking dates!");
        return res.redirect(`/listings/${id}`);
    }

    // Validate guests
    if (!guests || guests <= 0) {
        req.flash("error", "Please select number of guests!");
        return res.redirect(`/listings/${id}`);
    }

    // Conflict check
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

    // Calculate total price
    const totalPrice = listing.price * nights;

    // Create booking
    const booking = new Booking({
        listing: listing._id,
        user: req.user._id,
        startDate: checkIn,
        endDate: checkOut,
        guests,
        totalPrice
    });

    await booking.save();

    req.flash("success", "Booking confirmed!");
    res.redirect(`/listings/${id}/booking/${booking._id}`);
};


// =======================
// Show booking details
// =======================
module.exports.showBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId)
        .populate("listing")
        .populate("user");

    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/listings");
    }

    res.render("booking/show", { booking });
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
