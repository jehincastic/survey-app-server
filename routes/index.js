const express = require("express"),
    router = express.Router(),
    bcrypt = require("bcrypt-nodejs"),
    connection = require("../connection"),
    jwt = require("jsonwebtoken"),
    User = require("../models/user");

router.post("/register", (req, res) => {
    const { name, email, password } = req.body;
    const newU = {
        name: name,
        email: email
    };
    // bcrypt.hash(password, null, null, (err, hash) => {
    //     let hashedPassword = hash;
    //     newU.password = hashedPassword;

    //     connection.query(
    //         "INSERT INTO survey_user SET ?",
    //         newU,
    //         (error, results, fields) => {
    //             if (error) {
    //                 res.json({ message: "Email Already Found" });
    //             } else {
    //                 connection.query(
    //                     "SELECT * FROM survey_user WHERE email = ?",
    //                     email,
    //                     (error, results, fields) => {
    //                         if (error) {
    //                             res.json({ message: "Email Already Found" });
    //                         } else {
    //                             const userDisplay = {
    //                                 id: results[0].id,
    //                                 name: results[0].name,
    //                                 email: results[0].email
    //                             };
    //                             const token = jwt.sign(
    //                                 { ...userDisplay },
    //                                 "privateKey"
    //                             );
    //                             res.json({
    //                                 token: token,
    //                                 message: "Registered Successfully"
    //                             });
    //                         }
    //                     }
    //                 );
    //             }
    //         }
    //     );
    // });

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

    // connection.query(
    //     "SELECT * FROM survey_user WHERE email = ?",
    //     email,
    //     (error, results, fields) => {
    //         if (error) {
    //             res.json({ message: "Email / Password is Wrong" });
    //         } else {
    //             const hashedPassword = results[0].password;
    //             bcrypt.compare(password, hashedPassword, (err, result) => {
    //                 if (result) {
    //                     const userDisplay = {
    //                         id: results[0].id,
    //                         name: results[0].name,
    //                         email: results[0].email
    //                     };
    //                     const token = jwt.sign(
    //                         { ...userDisplay },
    //                         "privateKey"
    //                     );
    //                     res.json({
    //                         token: token,
    //                         message: "Logged In Successfully"
    //                     });
    //                 } else {
    //                     res.json({ message: "Email / Password is Wrong" });
    //                 }
    //             });
    //         }
    //     }
    // );

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
