const express = require("express");
const router = express.Router();
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware");
const userController = require ("../controllers/users");
const middleware = require("../middleware");
const Listing = require("../models/listing");
const Booking = require("../models/booking");


router.route("/signup")
        .get(userController.renderSignUp )
        .post(wrapAsync ( userController.userSignup))



router.route("/login")
    .get(userController.renderLogin)
    .post( saveRedirectUrl ,
    passport.authenticate( "local" 
        ,{ failureRedirect : '/users/login' , 
            failureFlash : true })
, userController.userLogin);


router.get("/logout" ,userController.userLogout )
// Profile
router.get("/profile", middleware.isLogged, wrapAsync(userController.renderProfile));
router.get("/profile/edit", middleware.isLogged, wrapAsync(userController.renderEditProfile));
router.post("/profile/edit", middleware.isLogged, wrapAsync(userController.updateProfile));

// Bookings
router.get("/my-listings/bookings", middleware.isLogged, wrapAsync(userController.pendingBookings));
router.get("/:id/bookings", middleware.isLogged, wrapAsync(userController.userBookings));

router.post("/:bookingId/approve", middleware.isLogged, wrapAsync(userController.approveBooking));
router.post("/:bookingId/reject", middleware.isLogged, wrapAsync(userController.rejectBooking));

// Guests
router.get("/guests", middleware.isLogged, wrapAsync(userController.myGuests));

module.exports = router;