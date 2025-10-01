const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    guests: { type: Number, required: true, min: 1 },

    totalPrice: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    }
  },
  { timestamps: true }
);

// Pre-save hook: calculate totalPrice based on Listing rent
bookingSchema.pre("save", async function(next) {
  const listing = await mongoose.model("Listing").findById(this.listing);
  if (listing) {
    const days = Math.max(Math.ceil((this.endDate - this.startDate)/(1000*60*60*24)), 1);
    this.totalPrice = listing.price * days; // use 'price' instead of 'rent'
  }
  next();
});


const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
