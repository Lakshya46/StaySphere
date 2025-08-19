const { required } = require("joi");
const  mongoose = require("mongoose");
const Schema = mongoose.Schema ;
const passportLocalMongoose =require ("passport-local-mongoose");


const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  name: String,
  bio: String,
  phone: String,
  avatar: {
    type: String,
    default: "https://i.ibb.co/2FxW9Nz/default-avatar.png"
  },
  location: String,
  occupation: String,
  dob: Date ,
  wishlist: [{ type: Schema.Types.ObjectId, ref: "Listing" }],
  likes: [{ type: Schema.Types.ObjectId, ref: "Listing" }]

});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);
