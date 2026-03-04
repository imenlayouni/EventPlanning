const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema({
  label: String,
  type: String, // text | number | select | checkbox
  options: [String],
});

const ItemSchema = new mongoose.Schema({

  category: String,

  fields: [fieldSchema],

});

module.exports = mongoose.model("ServiceItem", ItemSchema);
