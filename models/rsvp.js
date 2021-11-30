const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const rsvpSchema = new Schema({
  connection: {
    type: Schema.Types.ObjectId,
    ref: "connection",
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  commitment: {
    type: String,
    enum: {
      values: ["yes", "no", "maybe"],
      message: "RSVP can only include 'yes','no', or 'maybe'",
    },
    required: [true, "RSVP is required"],
  },
});

module.exports = mongoose.model("RSVP", rsvpSchema);
