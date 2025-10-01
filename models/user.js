const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: String,
  bio: String,
  phone: String,
  
  // Profile picture
  avatar: {
    type: String,
    default: "https://i.ibb.co/2FxW9Nz/default-avatar.png",
  },

  // Personal details
  location: String,
  occupation: { type: String, enum: ["student", "professional", "other"], default: "other" },
  dob: Date,
  gender: { type: String, enum: ["male", "female", "other"], default: "other" },

  // Engagement
  wishlist: [{ type: Schema.Types.ObjectId, ref: "Listing" }],
  likes: [{ type: Schema.Types.ObjectId, ref: "Listing" }],
  bookings: [{ type: Schema.Types.ObjectId, ref: "Booking" }], // track user's bookings
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }]   // track reviews made by user
}, { timestamps: true });

// Passport plugin for local authentication (username/password)
userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports = mongoose.model("User", userSchema);
