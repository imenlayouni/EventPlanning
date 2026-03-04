const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({

  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  name: String,

  services: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
    }
  ],

});

module.exports = mongoose.model("Event", eventSchema);
