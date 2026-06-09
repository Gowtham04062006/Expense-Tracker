const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

/* Get Profile */
router.get("/", auth, async (req, res) => {

    try {

        const user = await User.findById(req.user.id)
            .select("-password");

        res.json(user);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});

/* Update Profile */
router.put("/", auth, async (req, res) => {

    try {

        const {
            name,
            country,
            currency,
            budget,
            chatId
        } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                name,
                country,
                currency,
                budget,
                chatId
            },
            {
                new: true
            }
        ).select("-password");

        res.json(user);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});

module.exports = router;