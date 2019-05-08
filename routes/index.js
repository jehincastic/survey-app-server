const express = require("express"),
    router = express.Router(),
    bcrypt = require("bcrypt-nodejs"),
    jwt = require("jsonwebtoken"),
    User = require("../models/user");

router.post("/register", (req, res) => {
    const { name, email, password } = req.body;
    const newU = {
        name: name,
        email: email
    };
    User.find({ email: newU.email }, (err, user) => {
        if (err) {
            console.log(err);
        } else {
            if (user.length === 0) {
                bcrypt.hash(password, null, null, function(err, hash) {
                    let hashedPassword = hash;
                    const newUser = new User({
                        ...newU,
                        password: hashedPassword
                    });
                    User.create(newUser, (err, user) => {
                        if (err) {
                            console.log(err);
                        } else {
                            const userDisplay = {
                                id: user.id,
                                name: user.name,
                                email: user.email
                            };
                            const token = jwt.sign(
                                { ...userDisplay },
                                "privateKey"
                            );
                            res.json({
                                token: token,
                                message: "Registered Successfully"
                            });
                        }
                    });
                });
            } else {
                res.json({ message: "Email Already Found" });
            }
        }
    });
});

router.post("/login", (req, res) => {
    const { email, password } = req.body;
    User.findOne({ email: email }, (err, user) => {
        if (err) {
            console.log(err);
        } else {
            if (user) {
                bcrypt.compare(password, user.password, function(err, result) {
                    if (result) {
                        const loggedInUser = {
                            id: user.id,
                            name: user.name,
                            email: user.email
                        };
                        const token = jwt.sign(
                            { ...loggedInUser },
                            "privateKey"
                        );
                        res.json({
                            token: token,
                            message: "Logged In Successfully"
                        });
                    } else {
                        res.json({
                            message: "Email / Password is Wrong"
                        });
                    }
                });
            } else {
                res.json({ message: "Email / Password is Wrong" });
            }
        }
    });
});

module.exports = router;
