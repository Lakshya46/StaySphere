const Listing = require("./models/listing");
const Review = require("./models/review");
const {reviewSchema }= require("./schema");
const {listingSchema}= require("./schema");
const ExpressError = require("./utils/ExpressError");

module.exports.isLogged = (req ,res ,next )=> {
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl ;
        req.flash("error" , "you must be logged in");
        return res.redirect ("/users/login");

    }
    next();
}



module.exports.saveRedirectUrl = (req , res , next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl ;
        delete req.session.redirectUrl;
    }
    next();
}

module.exports.isOwner  = async (req , res ,next) =>{
let {id} = req.params ;

let listing = await Listing.findById(id);
if(!listing.owner._id.equals(res.locals.currentuser._id)){
    req.flash("error" , "You dont have permission to edit");
    return res.redirect(`/listings/${id}`);
}
next();
}

module.exports.isReviewAuthor  = async (req , res ,next) =>{
let { id , reviewId} = req.params ;

let review = await Review.findById(reviewId);
if(!review.author._id.equals(res.locals.currentuser._id)){
    req.flash("error" , "You are not the author of the review");
    return res.redirect(`/listings/${id}`);
}
next();
}

module.exports.validateReview = async(req ,res ,next ) => {
    let {error} = reviewSchema.validate(req.body);
    if(error){
        let errormessage = error.details.map((el)=>el.message).join(",");
        throw new ExpressError (404 , errormessage )
    }else{
        next();
    }
;}

module.exports.validateListing   = ( req ,res ,next) => {
    let {error}  = listingSchema.validate(req.body);
    if( error){
        let errormessage = error.details.map((el)=> el.message).join(",");
        throw new ExpressError( 404 , errormessage)
    }
    else{
        next();
    }
}
