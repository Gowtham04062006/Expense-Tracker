const mongoose = require("mongoose");

const PersonSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  name: String
});

module.exports = mongoose.model("Person", PersonSchema);