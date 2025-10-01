
const ExpressError = require("../utils/ExpressError");

const Review = require("../models/review");
const Listing = require("../models/listing");

module.exports.createReview = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        const newReview = new Review(req.body.review);
        newReview.author = req.user._id;
        newReview.listing = listing._id;  // <-- add this line

        await newReview.save();

        listing.reviews.push(newReview._id);
        await listing.save();

        req.flash("success", "New review created");
        res.redirect(`/listings/${listing._id}`);
    } catch (err) {
        console.error(err);
        req.flash("error", "Could not create review");
        res.redirect(`/listings/${req.params.id}`);
    }
};



module.exports.destroyReview = async(req ,res)=>{

    let {id , reviewId } = req.params;
    await Listing.findByIdAndUpdate(id ,{ $pull : {reviews : reviewId}});

    await Review.findByIdAndDelete(reviewId);

    req.flash("success" ,"review deleted");
    res.redirect(`/listings/${id}`);
}
