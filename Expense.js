const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  date: String,
  category: String,
  desc: String,
  amount: Number,
  person: {
    type: String,
    default: "Self"
  }
});

module.exports = mongoose.model("Expense", ExpenseSchema);