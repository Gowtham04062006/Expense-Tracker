const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: ""
  },
  country: {
    type: String,
    default: ""
  },
  currency: {
    type: String,
    default: "INR"
  },
  budget: {
    type: Number,
    default: 0
  },
  chatId: {
    type: String,
    default: ""
  }
});

module.exports = mongoose.model("User", UserSchema);