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
      url: {
        type: String,
        required: function () {
          // required only if this is a new document
          return this.isNew;
        },
      },
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
    price: { type: Number, required: true }, // per day
    deposit: { type: Number, default: 0 },
    stayType: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "monthly",
    },

    // Property type / BHK type
    propertyType: {
      type: String,
      enum: ["Flat", "PG", "Studio"],
      required: true,
    },
    bhkType: {
      type: String,
      enum: ["1BHK", "2BHK", "3BHK", "4BHK+", "Studio", "More"],
      required: function () {
        return this.propertyType === "Flat";
      },
    },

    // Bedrooms & Bathrooms
  // Bedrooms & Bathrooms
bedrooms: {
  type: Number,
  required: function () {
    return this.propertyType === "Flat"; // Only required for Flats
  },
  min: 1,
},
bathrooms: {
  type: Number,
  required: function () {
    return this.propertyType === "Flat"; // Only required for Flats
  },
  min: 1,
},

    // Amenities
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
    pincode: { type: String, required: true },
    nearby: { type: Boolean, default: false },

    // Additional info
    additionalInfo: String,
    mapLink: String,
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },

    // Availability Dates
    availableFrom: { type: Date },
    availableTo: { type: Date },

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
