const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");
const Listing = require("../models/listing");

const Review = require("../models/review");
const {reviewSchema }= require("../schema");
const middleware = require("../middleware");
const listingController = require("../controllers/listings");
const multer  = require('multer')
const { storage } = require("../cloudConfig");
const upload = multer({ storage });



//Index route
router.get("/" ,  wrapAsync (listingController.index));


// New route
router.get("/new" ,middleware.isLogged,  listingController.renderNewListingForm);

// create route 
router.post("/" ,  middleware.isLogged ,
    middleware.validateListing ,
    upload.single("listing[image]"),
     wrapAsync(listingController.createNewListing));


//show route
router.get("/:id" , wrapAsync (listingController.renderShowListing));
// Edit Route
router.get("/:id/edit"  , middleware.isLogged , middleware.isOwner, wrapAsync( listingController.renderEditForm));

// update Route
router.put("/:id"  ,  middleware.isLogged , middleware.isOwner,  upload.single("listing[image]"), middleware.validateListing , wrapAsync( listingController.updateListing) );

// DELETE ROUTE
router.delete("/:id"  , middleware.isLogged , middleware.isOwner,  wrapAsync( listingController.destroyListing));




// routes/listings.js
router.post("/:id/like", middleware.isLogged, async (req, res) => {
  let listing = await Listing.findById(req.params.id);
  let user = req.user;

  if (!user.likes.includes(listing._id)) {
    user.likes.push(listing._id);
  } else {
    user.likes.pull(listing._id); // toggle like
  }
  await user.save();
  res.redirect(`/listings/${listing._id}`);
});

router.post("/:id/wishlist",middleware.isLogged, async (req, res) => {
  let listing = await Listing.findById(req.params.id);
  let user = req.user;

  if (!user.wishlist.includes(listing._id)) {
    user.wishlist.push(listing._id);
  } else {
    user.wishlist.pull(listing._id); // toggle wishlist
  }
  await user.save();
  res.redirect(`/listings/${listing._id}`);
});



module.exports = router;
