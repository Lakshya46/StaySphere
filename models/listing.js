const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review");

const listingSchema = new Schema(
  {
    // Basic info
    title: { type: String, required: true },
    description: { type: String, required: true },

    // Featured image
    featuredImage: {
      url: { type: String, required: true },
      filename: String,
    },

    // Additional images
    images: [
      {
        url: { type: String, required: true },
        filename: String,
      },
    ],

    // Pricing
    price: { type: Number, required: true }, // matches form
    deposit: { type: Number, default: 0 },
    stayType: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "monthly",
    },

    // Property type / BHK type
    propertyType: {
      type: String,
      enum: ["Apartment/Flat", "House", "PG", "Homestay"],
      required: true,
    },
    bhkType: {
      type: String,
      enum: ["1BHK", "2BHK", "3BHK", "4BHK+", "Studio"],
      required: true,
    },

    // Bedrooms & Bathrooms
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },

    // Amenities (optional, multiple)
    amenities: [
      {
        type: String,
        enum: ["WiFi", "AC", "Parking"],
      },
    ],

    // Location
    country: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String, required: true },
    nearBy: String, // e.g., "Near RGPV Bhopal" or "Metro Station 500m"

    // Additional info
    additionalInfo: String,
    mapLink: String,

    // Ownership & Engagement
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    wishlistedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Middleware: Delete all reviews when listing is deleted
listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

module.exports = mongoose.model("Listing", listingSchema);
