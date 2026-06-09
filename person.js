const express = require("express");
const Person = require("../models/Person");
const auth = require("../middleware/auth");

const router = express.Router();

/* Get Persons */
router.get("/", auth, async (req, res) => {

    try {

        const persons = await Person.find({
            userId: req.user.id
        });

        res.json(persons);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});

/* Add Person */
router.post("/", auth, async (req, res) => {

    try {

        const person = new Person({
            userId: req.user.id,
            name: req.body.name
        });

        await person.save();

        res.json(person);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});

module.exports = router;