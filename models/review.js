const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
  {
    comment: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    
    // Link review to a user
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Link review to a listing
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },

    // Optional: mark if review is verified (e.g., only after booking)
    verified: { type: Boolean, default: false }
  },
  { timestamps: true } // automatically adds createdAt & updatedAt
);

// Optional: Index for faster query by listing
reviewSchema.index({ listing: 1, author: 1 });

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
