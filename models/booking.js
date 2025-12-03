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


const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
