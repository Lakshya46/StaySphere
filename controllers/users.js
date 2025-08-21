
const User = require("../models/user");
const Booking =require("../models/booking");
const Listing = require("../models/listing");




module.exports.renderSignUp = (req ,res)=>{

    res.render("users/signup.ejs");

}

module.exports.userSignup = async (req , res) => {
    try {
    let { username , email , password } = req.body;
    const newUser = new User({email , username});
    const registeredUser = await User.register(newUser , password);
    console.log(registeredUser);
    req.login(registeredUser , (e)=>{
        if(e){
            return next(e)        }
    req.flash("success" , "Successfully registered");
    res.redirect("/listings");
    })
   
        
    } catch (err) {
        console.log(err);
        req.flash("error" , err.message);
        res.redirect("/users/signup");
    }
}


module.exports.renderLogin = (req ,res)=>{
    res.render("users/login.ejs");
}


module.exports.userLogin = async (req ,res ,next) => {
req.flash("success" , "welcome to stay sphere");
let redirectUrl = res.locals.redirectUrl || "/listings";
res.redirect(redirectUrl);
}

module.exports.userLogout = (req , res , next )=>{
    req.logout((err)=>{
        if(err){
             return next(err);
        }
    req.flash("success" ,"you are logged out");
    res.redirect("/listings");
    })
}



// =======================
// PROFILE
// =======================
module.exports.renderProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing");

    res.render("users/profile", { user, bookings });
};

module.exports.renderEditProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    res.render("users/editProfile", { user });
};

module.exports.updateProfile = async (req, res) => {
    const { email, bio } = req.body;
    await User.findByIdAndUpdate(req.user._id, { email, bio });
    req.flash("success", "Profile updated successfully!");
    res.redirect("/users/profile");
};


// =======================
// BOOKINGS
// =======================
module.exports.pendingBookings = async (req, res) => {
    const listings = await Listing.find({ owner: req.user._id });
    const listingIds = listings.map(l => l._id);

    const bookings = await Booking.find({
        listing: { $in: listingIds },
        status: "pending"
    })
        .populate("listing")
        .populate("user");

    res.render("booking/pendingBookings", { bookings });
};

module.exports.userBookings = async (req, res) => {
    if (req.user._id.toString() !== req.params.id) {
        req.flash("error", "You are not authorized to view these bookings!");
        return res.redirect("/listings");
    }

    const bookings = await Booking.find({ user: req.params.id })
        .populate("listing")
        .sort({ createdAt: -1 });

    res.render("booking/myBookings", { bookings });
};
module.exports.approveBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId).populate("listing");

    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("back");
    }

    if (!booking.listing.owner.equals(req.user._id)) {
        req.flash("error", "You are not authorized to approve this booking!");
        return res.redirect("back");
    }

    if (booking.status !== "pending") {
        req.flash("error", `This booking is already ${booking.status}!`);
        return res.redirect("back");
    }

    // ✅ only update status instead of saving entire document
    await Booking.findByIdAndUpdate(req.params.bookingId, { status: "confirmed" });

    req.flash("success", "Booking approved!");
    res.redirect("/users/my-listings/bookings");
};

module.exports.rejectBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId).populate("listing");

    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("back");
    }

    if (!booking.listing.owner.equals(req.user._id)) {
        req.flash("error", "You are not authorized to reject this booking!");
        return res.redirect("back");
    }

    if (booking.status !== "pending") {
        req.flash("error", `This booking is already ${booking.status}!`);
        return res.redirect("back");
    }

    booking.status = "cancelled";
    await booking.save();
    req.flash("success", "Booking rejected!");
    res.redirect("/users/my-listings/bookings");
};


// =======================
// GUESTS
// =======================
module.exports.myGuests = async (req, res) => {
    const listings = await Listing.find({ owner: req.user._id });
    const listingIds = listings.map(l => l._id);

    const bookings = await Booking.find({ listing: { $in: listingIds } })
        .populate("listing")
        .populate("user"); // user = guest who booked

    res.render("users/myGuest", { bookings });
};

