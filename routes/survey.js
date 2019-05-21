const express = require("express"),
    router = express.Router(),
    connection = require("../connection"),
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
    let {
        user_id,
        title,
        questions,
        recipients,
        template,
        maxvalue,
        minvalue,
        colTitle
    } = req.body;
    // const newSurvey = {
    //     user_id,
    //     title,
    //     questions,
    //     recipients: recipients
    //         .split(",")
    //         .map(email => ({ email: email.trim() })),
    //     template: template,
    //     maxvalue: maxvalue,
    //     minvalue: minvalue,
    //     colTitle: colTitle
    // };

    if (colTitle === undefined) {
        colTitle = "";
    }
    if (maxvalue === undefined) {
        maxvalue = "";
    }
    if (minvalue === undefined) {
        minvalue = "";
    }
    const newSurveyTemplate = {
        survey_user_id: user_id,
        title: title,
        templateNo: template,
        maxvalue: maxvalue,
        minvalue: minvalue,
        coltitle: colTitle
    };

    connection.query(
        "INSERT INTO survey_template SET ?",
        newSurveyTemplate,
        (error, results, fields) => {
            if (error) {
                console.log(error);
                res.json({ message: "Survey Failed To Add" });
            } else {
                let done = true;
                const survey_id = results.insertId;
                questions.forEach(q => {
                    const ques = {
                        questions: q,
                        survey_template_id: survey_id
                    };
                    connection.query(
                        "INSERT INTO survey_questions SET ?",
                        ques,
                        (error, results, fields) => {
                            if (error) {
                                res.json({ message: "Survey Failed To Add" });
                                done = false;
                            }
                        }
                    );
                });
                if (done) {
                    const mail = recipients
                        .split(",")
                        .map(email => ({ email: email.trim() }));
                    mail.forEach(r => {
                        const recipient = {
                            email: r.email,
                            survey_template_id: survey_id
                        };
                        connection.query(
                            "INSERT INTO survey_recipient SET ?",
                            recipient,
                            (error, results, fields) => {
                                if (error) {
                                    res.json({
                                        message: "Survey Failed To Add"
                                    });
                                    done = false;
                                }
                            }
                        );
                    });
                    //connection.query("SELECT id from survey_recipient WHERE ");
                }
                if (done) {
                    const result = {
                        message: "Survey Added Successfully"
                    };
                    res.json(result);
                }
            }
        }
    );

    // Survey.create(newSurvey, (err, survey) => {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         const result = {
    //             message: "Survey Added Successfully"
    //         };
    //         res.json(result);
    //     }
    // });
});

router.get("/view", (req, res) => {
    const { user_id } = req.query;
    if (user_id !== "") {
        const userId = {
            survey_user_id: user_id
        };
        let survey_id = [];
        connection.query(
            "select st.id, st.title, sq.questions, sr.email from survey_template st inner join survey_questions sq on st.id = sq.survey_template_id inner join survey_recipient sr on st.id=sr.survey_template_id where survey_user_id=?",
            user_id,
            (err, results, fields) => {
                if (err) {
                    console.log(err);
                    res.json({ message: "Failed To Add" });
                } else {
                    const uniqueId = [...new Set(results.map(r => r.id))];
                    const uniqueTitle = [...new Set(results.map(r => r.title))];
                    const seperateArray = uniqueId.map(u => {
                        return results.filter(r => {
                            if (r.id === u) {
                                return r.questions;
                            }
                        });
                    });
                    const email = seperateArray.map(r => {
                        const temp = r.map(a => a.email);
                        return temp;
                    });
                    const uniqueEmail = email.map(e => [
                        ...new Set(e.map(r => r))
                    ]);
                    const questions = seperateArray.map(r => {
                        const temp = r.map(a => a.questions);
                        return temp;
                    });
                    const uniqueQuestions = questions.map(e => [
                        ...new Set(e.map(r => r))
                    ]);
                    const survey = uniqueTitle.map((u, i) => {
                        const a = {
                            id: uniqueId[i],
                            title: uniqueTitle[i],
                            noOfQuestions: uniqueQuestions[i].length,
                            noOfRecipients: uniqueEmail[i].length,
                            message: "Display Successfull"
                        };
                        return a;
                    });
                    res.json(survey);
                }
            }
        );

        // Survey.find({ user_id: user_id }, (err, surveys) => {
        //     if (err) {
        //         console.log(err);
        //     } else {
        //         const displaySurvey = surveys.map(survey => {
        //             const a = {
        //                 id: survey.id,
        //                 title: survey.title,
        //                 noOfQuestions: survey.questions.length,
        //                 noOfRecipients: survey.recipients.length,
        //                 message: "Display Successfull"
        //             };
        //             return a;
        //         });
        //         res.json(displaySurvey);
        //     }
        // });
    } else {
        res.json({ message: "Failed" });
    }
});

router.get("/view/:id", (req, res) => {
    const { id } = req.params;
    if (id !== "") {
        connection.query(
            "select st.id, st.survey_user_id, st.title, sq.questions, sr.email, sr.answers, sr.id as survey_recipient_id, sr.responded, st.templateNo, st.maxvalue, st.minvalue, st.coltitle from survey_template st inner join survey_questions sq on st.id = sq.survey_template_id inner join survey_recipient sr on st.id=sr.survey_template_id where st.id=?",
            id,
            (err, results, fields) => {
                if (err) {
                    console.log(err);
                    res.json({ message: "Failed To Find" });
                } else {
                    const uniqueId = [...new Set(results.map(r => r.id))];
                    const uniqueTitle = [...new Set(results.map(r => r.title))];
                    const seperateArray = uniqueId.map(u => {
                        return results.filter(r => {
                            if (r.id === u) {
                                return r.questions;
                            }
                        });
                    });
                    const email = seperateArray.map(r => {
                        const temp = r.map(a => a.email);
                        return temp;
                    });
                    const emailId = seperateArray.map(r => {
                        const temp = r.map(a => a.survey_recipient_id);
                        return temp;
                    });
                    const uniqueEmailId = emailId.map(e => [
                        ...new Set(e.map(r => r))
                    ]);
                    const uniqueEmail = email.map(e => [
                        ...new Set(e.map(r => r))
                    ]);
                    const questions = seperateArray.map(r => {
                        const temp = r.map(a => a.questions);
                        return temp;
                    });
                    const uniqueQuestions = questions.map(e => [
                        ...new Set(e.map(r => r))
                    ]);
                    const template = results[0].templateNo;
                    let j = 0;
                    const responded = results.map((r, i) => {
                        if (
                            r.questions === uniqueQuestions[0][j] &&
                            r.email === uniqueEmail[0][j]
                        ) {
                            j++;
                            return r.responded === "0" ? false : true;
                        }
                    });
                    const uniqueResponded = responded.filter(r => {
                        return r !== undefined;
                    });
                    let a = 0;
                    const answers = results.map(r => {
                        if (uniqueEmail[0][a] === r.email) {
                            a++;
                            return r.answers;
                        }
                    });
                    const uniqueAnswers = answers.filter(a => {
                        return a !== undefined;
                    });
                    const recipients = uniqueEmail[0].map((e, i) => {
                        let tempAns = [];
                        if (uniqueAnswers[i] === "-----") {
                            tempAns = [];
                        } else {
                            tempAns = uniqueAnswers[i];
                            tempAns = tempAns
                                .split(",")
                                .map(ans => ans.trim());
                        }
                        return {
                            responded: uniqueResponded[i],
                            answers: tempAns,
                            _id: uniqueEmailId[0][i].toString(),
                            email: e
                        };
                    });
                    const survey = [
                        {
                            questions: uniqueQuestions[0],
                            id,
                            title: uniqueTitle[0],
                            recipients: recipients,
                            template
                        }
                    ];
                    if (Number(template) === 2) {
                        survey[0].maxvalue = results[0].maxvalue;
                        survey[0].minvalue = results[0].minvalue;
                    } else if (Number(template) === 3) {
                        survey[0].colTitle = results[0].coltitle;
                    }
                    res.json(survey);
                }
            }
        );

        // Survey.find({ _id: id }, (err, survey) => {
        //     if (err) {
        //         console.log(err);
        //         res.json({ message: "Failed To Find" });
        //     } else {
        //         res.json(survey);
        //     }
        // });
    }
});

router.get("/send", (req, res) => {
    const { id } = req.query;
    if (id !== "") {
        connection.query(
            "select st.id, st.survey_user_id, st.title, sq.questions, sr.email, sr.id as survey_recipient_id, sr.responded, st.templateNo, st.maxvalue, st.minvalue, st.coltitle from survey_template st inner join survey_questions sq on st.id = sq.survey_template_id inner join survey_recipient sr on st.id=sr.survey_template_id where st.id=?",
            id,
            (err, results, fields) => {
                if (err) {
                    console.log(err);
                    res.json({ message: "Failed To Find" });
                } else {
                    const uniqueId = [...new Set(results.map(r => r.id))];
                    const seperateArray = uniqueId.map(u => {
                        return results.filter(r => {
                            if (r.id === u) {
                                return r.questions;
                            }
                        });
                    });
                    const email = seperateArray.map(r => {
                        const temp = r.map(a => a.email);
                        return temp;
                    });
                    const emailId = seperateArray.map(r => {
                        const temp = r.map(a => a.survey_recipient_id);
                        return temp;
                    });
                    const questions = seperateArray.map(r => {
                        const temp = r.map(a => a.questions);
                        return temp;
                    });
                    const uniqueQuestions = questions.map(e => [
                        ...new Set(e.map(r => r))
                    ]);
                    const uniqueEmailId = emailId.map(e => [
                        ...new Set(e.map(r => r))
                    ]);
                    const uniqueEmail = email.map(e => [
                        ...new Set(e.map(r => r))
                    ]);
                    let j = 0;
                    const responded = results.map((r, i) => {
                        if (
                            r.questions === uniqueQuestions[0][j] &&
                            r.email === uniqueEmail[0][j]
                        ) {
                            j++;
                            return r.responded === "0" ? false : true;
                        }
                    });
                    const uniqueResponded = responded.filter(r => {
                        return r !== undefined;
                    });
                    let done = true;
                    uniqueEmail[0].forEach((rec, i) => {
                        if (!uniqueResponded[i]) {
                            const mailOptions = {
                                from: "jehincastic@gmail.com",
                                to: rec,
                                subject: results[0].title,
                                html: `<p>Please take your survey <a href=http://localhost:3000/survey/${
                                    uniqueEmailId[0][i]
                                }/${id}>here</a>.</p>`
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
            }
        );

        // Survey.find({ _id: id }, (err, survey) => {
        //     if (err) {
        //         console.log(err);
        //     } else {
        //         const recipt = survey[0].recipients;
        //         let done = true;
        //         recipt.forEach((rec, i) => {
        //             if (!rec.responded) {
        //                 const mailOptions = {
        //                     from: "jehincastic@gmail.com",
        //                     to: rec.email,
        //                     subject: survey[0].title,
        //                     html: `<p>Please take your survey <a href=http://localhost:3000/survey/${
        //                         rec._id
        //                     }/${survey[0]._id}>here</a>.</p>`
        //                 };
        //                 transporter.sendMail(mailOptions, (err, info) => {
        //                     if (err) {
        //                         done = false;
        //                         console.log(err);
        //                         res.json({ message: err });
        //                     }
        //                 });
        //             }
        //         });
        //         if (done) {
        //             res.json({ message: "Send Successfully" });
        //         } else {
        //             res.json({ message: "failed to send" });
        //         }
        //     }
        // });
    } else {
        res.json({ message: "failed to send" });
    }
});

router.get("/:recid/:surid", (req, res) => {
    const { recid, surid } = req.params;

    connection.query(
        "select st.id, st.survey_user_id, st.title, sq.questions, sr.email, sr.id as survey_recipient_id, sr.responded, st.templateNo, st.maxvalue, st.minvalue, st.coltitle from survey_recipient sr inner join survey_questions sq on sr.survey_template_id = sq.survey_template_id inner join survey_template st on sr.survey_template_id = st.id where sr.id=?",
        recid,
        (err, results, fields) => {
            if (err) {
                console.log(results);
                console.log(err);
                res.json({ message: "404 Not Found" });
            } else {
                if (!results[0]) {
                    console.log(results);
                    res.json({ message: "404 Not Found" });
                } else {
                    let bool = false;
                    let completed = false;
                    const uniqueId = [...new Set(results.map(r => r.id))];
                    const uniqueTitle = [...new Set(results.map(r => r.title))];
                    const seperateArray = uniqueId.map(u => {
                        return results.filter(r => {
                            if (r.id === u) {
                                return r.questions;
                            }
                        });
                    });
                    const email = seperateArray.map(r => {
                        const temp = r.map(a => a.email);
                        return temp;
                    });
                    const emailId = seperateArray.map(r => {
                        const temp = r.map(a => a.survey_recipient_id);
                        return temp;
                    });
                    const uniqueEmailId = emailId.map(e => [
                        ...new Set(e.map(r => r))
                    ]);
                    const uniqueEmail = email.map(e => [
                        ...new Set(e.map(r => r))
                    ]);
                    const questions = seperateArray.map(r => {
                        const temp = r.map(a => a.questions);
                        return temp;
                    });
                    const uniqueQuestions = questions.map(e => [
                        ...new Set(e.map(r => r))
                    ]);
                    const template = results[0].templateNo;
                    let j = 0;
                    const responded = results.map((r, i) => {
                        if (
                            r.questions === uniqueQuestions[0][j] &&
                            r.email === uniqueEmail[0][j]
                        ) {
                            j++;
                            return r.responded === "0" ? false : true;
                        }
                    });
                    const uniqueResponded = responded.filter(r => {
                        return r !== undefined;
                    });
                    const recipients = uniqueEmail[0].map((e, i) => {
                        if (uniqueEmailId[0][i] == recid) {
                            bool = true;
                            if (uniqueResponded[i] === true) {
                                completed = true;
                            }
                            return {
                                responded: uniqueResponded[i],
                                answers: [],
                                _id: uniqueEmailId[0][i].toString(),
                                email: e
                            };
                        }
                    });
                    const uniqueRecipients = recipients.filter(r => {
                        return r !== undefined;
                    });
                    const survey = [
                        {
                            questions: uniqueQuestions[0],
                            id: surid,
                            title: uniqueTitle[0],
                            recipients: uniqueRecipients,
                            template
                        }
                    ];
                    if (Number(template) === 2) {
                        survey[0].maxvalue = results[0].maxvalue;
                        survey[0].minvalue = results[0].minvalue;
                    } else if (Number(template) === 3) {
                        survey[0].colTitle = results[0].coltitle;
                    }
                    if (bool && !completed) {
                        res.json(survey[0]);
                    } else if (bool && completed) {
                        res.json({ message: "Response Submitted" });
                    } else {
                        console.log("404");
                        res.json({ message: "404 Not Found" });
                    }
                }
            }
        }
    );

    // Survey.find({ _id: surid }, (err, survey) => {
    //     if (err) {
    //         console.log(err);
    //         res.json({ message: "404 Not Found" });
    //     } else {
    //         let bool = false;
    //         let completed = false;
    //         if (survey[0].recipients) {
    //             survey[0].recipients.forEach(r => {
    //                 if (r._id == recid) {
    //                     bool = true;
    //                 }
    //                 if (r._id == recid && r.responded) {
    //                     completed = true;
    //                 }
    //             });
    //             if (bool && !completed) {
    //                 res.json(survey[0]);
    //             } else if (bool && completed) {
    //                 res.json({ message: "Response Submitted" });
    //             } else {
    //                 res.json({ message: "404 Not Found" });
    //             }
    //         } else {
    //             res.json({ message: "404 Not Found" });
    //         }
    //     }
    // });
});

router.post("/:recid/:surid", (req, res) => {
    const { answers } = req.body;
    const { recid, surid } = req.params;
    let finalAnswers = "";
    answers.forEach((a, i) => {
        finalAnswers += a;
        if (answers.length - 1 !== i) {
            finalAnswers += ", ";
        }
    });
    connection.query(
        "UPDATE survey_recipient SET responded = ?, answers = ? WHERE id = ?",
        ["1", finalAnswers, recid],
        (err, results, fields) => {
            if (err) {
                res.json({ message: "Failed To Update" });
            } else {
                res.json({ message: "Updated" });
            }
        }
    );

    // Survey.find({ _id: surid }, (err, survey) => {
    //     if (err) {
    //         res.json({ message: "Failed To Update" });
    //         console.log(err);
    //     } else {
    //         let done = false;
    //         for (let i = 0; i < survey[0].recipients.length; i++) {
    //             if (survey[0].recipients[i]._id == recid) {
    //                 survey[0].recipients[i].answers = answers;
    //                 survey[0].recipients[i].responded = true;
    //                 done = true;
    //                 Survey.updateOne(
    //                     { _id: surid },
    //                     survey[0],
    //                     (err, updated) => {
    //                         if (err) {
    //                             res.json({ message: "Failed To Update" });
    //                         } else {
    //                             res.json({ message: "Updated" });
    //                         }
    //                     }
    //                 );
    //             }
    //         }
    //     }
    // });
});

module.exports = router;
