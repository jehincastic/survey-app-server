const express = require("express"),
    router = express.Router(),
    nodemailer = require("nodemailer"),
    keys = require("../keys/keys"),
    Survey = require("../models/survey");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: keys.email,
        pass: keys.emailPass
    }
});

router.post("/add", (req, res) => {
    const {
        user_id,
        title,
        questions,
        recipients,
        template,
        maxvalue,
        minvalue
    } = req.body;
    const newSurvey = {
        user_id,
        title,
        questions,
        recipients: recipients
            .split(",")
            .map(email => ({ email: email.trim() })),
        template: template,
        maxvalue: maxvalue,
        minvalue: minvalue
    };
    Survey.create(newSurvey, (err, survey) => {
        if (err) {
            console.log(err);
        } else {
            const result = {
                message: "Survey Added Successfully"
            };
            res.json(result);
        }
    });
});

router.get("/view", (req, res) => {
    const { user_id } = req.query;
    if (user_id !== "") {
        Survey.find({ user_id: user_id }, (err, surveys) => {
            if (err) {
                console.log(err);
            } else {
                const displaySurvey = surveys.map(survey => {
                    const a = {
                        id: survey.id,
                        title: survey.title,
                        noOfQuestions: survey.questions.length,
                        noOfRecipients: survey.recipients.length,
                        message: "Display Successfull"
                    };
                    return a;
                });
                res.json(displaySurvey);
            }
        });
    } else {
        res.json({ message: "Failed" });
    }
});

router.get("/view/:id", (req, res) => {
    const { id } = req.params;
    if (id !== "") {
        Survey.find({ _id: id }, (err, survey) => {
            if (err) {
                console.log(err);
            } else {
                res.json(survey);
            }
        });
    }
});

router.get("/send", (req, res) => {
    const { id } = req.query;
    if (id !== "") {
        Survey.find({ _id: id }, (err, survey) => {
            if (err) {
                console.log(err);
            } else {
                const recipt = survey[0].recipients;
                let done = true;
                recipt.forEach((rec, i) => {
                    if (!rec.responded) {
                        const mailOptions = {
                            from: "jehincastic@gmail.com",
                            to: rec.email,
                            subject: survey[0].title,
                            html: `<p>Please take your survey <a href=http://localhost:3000/survey/${
                                rec._id
                            }/${survey[0]._id}>here</a>.</p>`
                        };
                        transporter.sendMail(mailOptions, (err, info) => {
                            if (err) {
                                done = false;
                                console.log(err);
                                res.json({ message: err });
                            }
                        });
                    }
                });
                if (done) {
                    res.json({ message: "Send Successfully" });
                } else {
                    res.json({ message: "failed to send" });
                }
            }
        });
    }
});

router.get("/:recid/:surid", (req, res) => {
    const { recid, surid } = req.params;
    Survey.find({ _id: surid }, (err, survey) => {
        if (err) {
            console.log(err);
            res.json({ message: "404 Not Found" });
        } else {
            let bool = false;
            let completed = false;
            if (survey[0].recipients) {
                survey[0].recipients.forEach(r => {
                    if (r._id == recid) {
                        bool = true;
                    }
                    if (r._id == recid && r.responded) {
                        completed = true;
                    }
                });
                if (bool && !completed) {
                    res.json(survey[0]);
                } else if (bool && completed) {
                    res.json({ message: "Response Submitted" });
                } else {
                    res.json({ message: "404 Not Found" });
                }
            } else {
                res.json({ message: "404 Not Found" });
            }
        }
    });
});

router.post("/:recid/:surid", (req, res) => {
    const { answers } = req.body;
    const { recid, surid } = req.params;
    Survey.find({ _id: surid }, (err, survey) => {
        if (err) {
            res.json({ message: "Failed To Update" });
            console.log(err);
        } else {
            let done = false;
            for (let i = 0; i < survey[0].recipients.length; i++) {
                if (survey[0].recipients[i]._id == recid) {
                    survey[0].recipients[i].answers = answers;
                    survey[0].recipients[i].responded = true;
                    done = true;
                    Survey.updateOne(
                        { _id: surid },
                        survey[0],
                        (err, updated) => {
                            if (err) {
                                res.json({ message: "Failed To Update" });
                            } else {
                                res.json({ message: "Updated" });
                            }
                        }
                    );
                }
            }
        }
    });
});

module.exports = router;
