const express = require("express");
const router =express.Router({mergeParams :true});
const wrapAsync = require("../utils/wrapAsync");


const middleware = require("../middleware");

const reviewController = require("../controllers/reviews");





// reviews route
router.post("/"  ,middleware.isLogged 
     ,middleware.validateReview,
    wrapAsync(reviewController.createReview));
// review delete

router.delete("/:reviewId" , middleware.isLogged,
     middleware.isReviewAuthor ,
      wrapAsync( reviewController.destroyReview));

module.exports = router;