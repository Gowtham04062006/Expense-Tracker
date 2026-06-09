const express = require("express");
const Expense = require("../models/Expense");
const auth = require("../middleware/auth");

const router = express.Router();

/* Get All Expenses */
router.get("/", auth, async (req, res) => {

    try {

        const expenses = await Expense.find({
            userId: req.user.id
        });

        res.json(expenses);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});

/* Add Expense */
router.post("/", auth, async (req, res) => {

    try {

        const expense = new Expense({
            userId: req.user.id,
            date: req.body.date,
            category: req.body.category,
            desc: req.body.desc,
            amount: req.body.amount,
            person: req.body.person
        });

        await expense.save();

        res.json(expense);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});

/* Update Expense */
router.put("/:id", auth, async (req, res) => {

    try {

        const expense = await Expense.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(expense);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});

/* Delete Expense */
router.delete("/:id", auth, async (req, res) => {

    try {

        await Expense.findByIdAndDelete(
            req.params.id
        );

        res.json({
            message: "Deleted"
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});

module.exports = router;