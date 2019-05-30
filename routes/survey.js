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
    const { user_id, survey } = req.body;

    const questionsTemplate1 = survey.template1.questions;
    const questionsTemplate2 = survey.template2.questions;
    const questionsTemplate3 = survey.template3.questions;
    const maxvalue = survey.template2.maxvalue;
    const minvalue = survey.template2.minvalue;
    const colTitle = survey.template3.colTitle;

    const stringQuestions = arr => {
        let string = "";
        for (let i = 0; i < arr.length; i++) {
            if (i === arr.length - 1) {
                string += arr[i];
            } else {
                string += arr[i] + ", ";
            }
        }
        return string;
    };

    const stringQuesTemp1 = stringQuestions(questionsTemplate1);
    const stringQuesTemp2 = stringQuestions(questionsTemplate2);
    const stringQuesTemp3 = stringQuestions(questionsTemplate3);
    const title = survey.title;
    const email = survey.emails;

    const newSurvey = {
        survey_user_id: user_id,
        title,
        temp1Ques: stringQuesTemp1,
        temp2Ques: stringQuesTemp2,
        temp3Ques: stringQuesTemp3,
        maxvalue,
        minvalue,
        colTitle
    };

    connection.query(
        "INSERT INTO survey_template SET ?",
        newSurvey,
        (error, results, fields) => {
            if (error) {
                console.log(error);
                res.json({ message: "Survey Failed To Add" });
            } else {
                let done = true;
                const survey_id = results.insertId;
                if (done) {
                    const mail = email
                        .split(",")
                        .map(email => ({ email: email.trim() }));
                    mail.forEach(r => {
                        const recipient = {
                            email: r.email,
                            survey_template_id: survey_id,
                            temp1Ans: "-----",
                            temp2Ans: "-----",
                            temp3Ans: "-----"
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

//29 16

router.get("/view", (req, res) => {
    const { user_id } = req.query;
    if (user_id !== "") {
        const userId = {
            survey_user_id: user_id
        };
        let survey_id = [];
        connection.query(
            "select st.id, st.title, st.temp1Ques, st.temp2Ques, st.temp3Ques, sr.email from survey_template st inner join survey_recipient sr on st.id=sr.survey_template_id where survey_user_id=?",
            user_id,
            (err, results, fields) => {
                if (err) {
                    console.log(err);
                    res.json({ message: "Failed To Add" });
                } else {
                    const uniqueId = [...new Set(results.map(r => r.id))];
                    const uniqueTitle = [...new Set(results.map(r => r.title))];
                    const allQuestions = uniqueId.map(u => {
                        const ques = [];
                        for (let i = 0; i < results.length; i++) {
                            if (results[i].id === u) {
                                const questions =
                                    results[i].temp1Ques +
                                    ", " +
                                    results[i].temp2Ques +
                                    ", " +
                                    results[i].temp3Ques;
                                ques.push(questions);
                            }
                        }
                        return ques;
                    });
                    const uniqueQuestions = allQuestions.map(q => {
                        const length = q.length - 1;
                        return q[length];
                    });
                    const quesArr = uniqueQuestions.map(uq =>
                        uq.split(",").map(q => q.trim())
                    );
                    const allEmail = uniqueId.map(u => {
                        const email = [];
                        for (let i = 0; i < results.length; i++) {
                            if (results[i].id === u) {
                                email.push(results[i].email);
                            }
                        }
                        return email;
                    });
                    const survey = uniqueTitle.map((u, i) => {
                        const a = {
                            id: uniqueId[i],
                            title: uniqueTitle[i],
                            noOfQuestions: quesArr[i].length,
                            noOfRecipients: allEmail[i].length,
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
            "select st.id, st.survey_user_id, st.title, st.temp1Ques, st.temp2Ques, st.temp3Ques, sr.email, sr.temp1Ans, sr.temp2Ans, sr.temp3Ans, sr.id as survey_recipient_id, sr.responded, st.templateNo, st.maxvalue, st.minvalue, st.coltitle from survey_template st inner join survey_recipient sr on st.id=sr.survey_template_id where st.id=?",
            id,
            (err, results, fields) => {
                if (err) {
                    console.log(err);
                    res.json({ message: "Failed To Find" });
                } else {
                    const uniqueId = [...new Set(results.map(r => r.id))];
                    const uniqueTitle = [...new Set(results.map(r => r.title))];
                    const allQuestions = uniqueId.map(u => {
                        const ques = [];
                        for (let i = 0; i < results.length; i++) {
                            if (results[i].id === u) {
                                const questions =
                                    results[i].temp1Ques +
                                    ", " +
                                    results[i].temp2Ques +
                                    ", " +
                                    results[i].temp3Ques;
                                ques.push(questions);
                            }
                        }
                        return ques;
                    });
                    const uniqueQuestions = allQuestions.map(q => {
                        const length = q.length - 1;
                        return q[length];
                    });
                    const quesArr = uniqueQuestions.map(uq =>
                        uq.split(",").map(q => q.trim())
                    );
                    const allEmail = uniqueId.map(u => {
                        const email = [];
                        for (let i = 0; i < results.length; i++) {
                            if (results[i].id === u) {
                                email.push(results[i].email);
                            }
                        }
                        return email;
                    });
                    const responded = uniqueId.map(u => {
                        const res = [];
                        for (let i = 0; i < results.length; i++) {
                            if (results[i].id === u) {
                                res.push(results[i].responded);
                            }
                        }
                        return res;
                    });
                    const allAnswers = results.map((r, i) => {
                        const ans = [];
                        ans.push(results[i].temp1Ans);
                        ans.push(results[i].temp2Ans);
                        ans.push(results[i].temp3Ans);
                        return ans;
                    });
                    // const seperateArray = uniqueId.map(u => {
                    //     return results.filter(r => {
                    //         if (r.id === u) {
                    //             return r.questions;
                    //         }
                    //     });
                    // });
                    // const email = seperateArray.map(r => {
                    //     const temp = r.map(a => a.email);
                    //     return temp;
                    // });
                    // const emailId = seperateArray.map(r => {
                    //     const temp = r.map(a => a.survey_recipient_id);
                    //     return temp;
                    // });
                    // const uniqueEmailId = emailId.map(e => [
                    //     ...new Set(e.map(r => r))
                    // ]);
                    // const uniqueEmail = email.map(e => [
                    //     ...new Set(e.map(r => r))
                    // ]);
                    // const questions = seperateArray.map(r => {
                    //     const temp = r.map(a => a.questions);
                    //     return temp;
                    // });
                    // const uniqueQuestions = questions.map(e => [
                    //     ...new Set(e.map(r => r))
                    // ]);
                    // const template = results[0].templateNo;
                    // let j = 0;
                    // const responded = results.map((r, i) => {
                    //     if (
                    //         r.questions === uniqueQuestions[0][j] &&
                    //         r.email === uniqueEmail[0][j]
                    //     ) {
                    //         j++;
                    //         return r.responded === "0" ? false : true;
                    //     }
                    // });
                    // const uniqueResponded = responded.filter(r => {
                    //     return r !== undefined;
                    // });
                    // let a = 0;
                    // const answers = results.map(r => {
                    //     if (uniqueEmail[0][a] === r.email) {
                    //         a++;
                    //         return r.answers;
                    //     }
                    // });
                    // const uniqueAnswers = answers.filter(a => {
                    //     return a !== undefined;
                    // });
                    const recipients = allEmail[0].map((e, i) => {
                        let tempAns = [];
                        if (
                            allAnswers[0][i] === "-----" ||
                            allAnswers[0][i] === null
                        ) {
                            tempAns = [];
                        } else {
                            tempAns = allAnswers[i];
                            let ansTemp = "";
                            for (let j = 0; j < allAnswers[i].length; j++) {
                                if (j === allAnswers[i].length - 1) {
                                    ansTemp += allAnswers[i][j];
                                } else {
                                    ansTemp += allAnswers[i][j] + ", ";
                                }
                            }
                            ansTemp = ansTemp.split(",").map(ans => ans.trim());
                            tempAns = ansTemp;
                            let empty = true;
                            for (let j = 0; j < tempAns.length; j++) {
                                if (tempAns[j] !== "-----") {
                                    empty = false;
                                }
                            }
                            if (empty) {
                                tempAns = [];
                            }
                        }
                        return {
                            responded: responded[0][i],
                            answers: tempAns,
                            _id: "uniqueEmailId[0][i].toString()",
                            email: e
                        };
                    });
                    const survey = [
                        {
                            questions: quesArr[0],
                            id,
                            title: uniqueTitle[0],
                            recipients: recipients
                        }
                    ];
                    // if (Number(template) === 2) {
                    //     survey[0].maxvalue = results[0].maxvalue;
                    //     survey[0].minvalue = results[0].minvalue;
                    // } else if (Number(template) === 3) {
                    //     survey[0].colTitle = results[0].coltitle;
                    // }
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
            "select st.id, st.survey_user_id, st.title, sr.email, sr.id as survey_recipient_id, sr.responded from survey_template st inner join survey_recipient sr on st.id=sr.survey_template_id where st.id=?",
            id,
            (err, results, fields) => {
                if (err) {
                    console.log(err);
                    res.json({ message: "Failed To Find" });
                } else {
                    const uniqueId = [
                        ...new Set(results.map(r => r.survey_recipient_id))
                    ];
                    const allEmail = uniqueId.map(u => {
                        const email = [];
                        for (let i = 0; i < results.length; i++) {
                            email.push(results[i].email);
                        }
                        return email;
                    });
                    const emails = allEmail[0];
                    // const seperateArray = uniqueId.map(u => {
                    //     return results.filter(r => {
                    //         if (r.id === u) {
                    //             return r.questions;
                    //         }
                    //     });
                    // });
                    // const email = seperateArray.map(r => {
                    //     const temp = r.map(a => a.email);
                    //     return temp;
                    // });
                    // const emailId = seperateArray.map(r => {
                    //     const temp = r.map(a => a.survey_recipient_id);
                    //     return temp;
                    // });
                    // const questions = seperateArray.map(r => {
                    //     const temp = r.map(a => a.questions);
                    //     return temp;
                    // });
                    // const uniqueQuestions = questions.map(e => [
                    //     ...new Set(e.map(r => r))
                    // ]);
                    // const uniqueEmailId = emailId.map(e => [
                    //     ...new Set(e.map(r => r))
                    // ]);
                    // const uniqueEmail = email.map(e => [
                    //     ...new Set(e.map(r => r))
                    // ]);
                    // let j = 0;
                    // const responded = results.map((r, i) => {
                    //     if (
                    //         r.questions === uniqueQuestions[0][j] &&
                    //         r.email === uniqueEmail[0][j]
                    //     ) {
                    //         j++;
                    //         return r.responded === "0" ? false : true;
                    //     }
                    // });
                    // const uniqueResponded = responded.filter(r => {
                    //     return r !== undefined;
                    // });
                    // let done = true;
                    // console.log(uniqueEmail);
                    const responded = uniqueId.map(u => {
                        const res = [];
                        for (let i = 0; i < results.length; i++) {
                            res.push(results[i].responded);
                        }
                        return res;
                    });
                    const uniqueResponded = responded[0];
                    let done = true;
                    console.log(emails);
                    emails.forEach((rec, i) => {
                        if (!Number(uniqueResponded[i])) {
                            const mailOptions = {
                                from: "jehincastic@gmail.com",
                                to: rec,
                                subject: results[0].title,
                                html: `<p>Please take your survey <a href=https://review-app-7e593.firebaseapp.com/?user_id=${
                                    uniqueId[i]
                                }&sur_id=${id}>here</a>.</p>`
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
        "select st.id, st.survey_user_id, st.title, st.temp1Ques, st.temp2Ques, st.temp3Ques, sr.email, sr.id as survey_recipient_id, sr.responded, st.maxvalue, st.minvalue, st.coltitle from survey_recipient sr inner join survey_template st on sr.survey_template_id = st.id where sr.id=?",
        recid,
        (err, results, fields) => {
            if (err) {
                console.log(err);
                res.json({ message: "404 Not Found" });
            } else {
                if (!results[0]) {
                    res.json({ message: "404 Not Found" });
                } else if (!(Number(results[0].id) === Number(surid))) {
                    res.json({ message: "404 Not Found" });
                } else if (results[0].responded === "1") {
                    res.json({ message: "Response Submitted" });
                } else {
                    const _id = results[0].id;
                    const user_id = results[0].survey_user_id;
                    const title = results[0].title;
                    const maxvalue = results[0].maxvalue;
                    const minvalue = results[0].minvalue;
                    const coltitle = results[0].coltitle;
                    const recipients = [
                        {
                            responded: Number(results[0].responded)
                                ? true
                                : false,
                            answers: [],
                            _id: results[0].survey_recipient_id,
                            email: results[0].email
                        }
                    ];
                    const temp1QuesStr = results[0].temp1Ques
                        .split(",")
                        .map(ans => ans.trim());
                    const temp2QuesStr = results[0].temp2Ques
                        .split(",")
                        .map(ans => ans.trim());
                    const temp3QuesStr = results[0].temp3Ques
                        .split(",")
                        .map(ans => ans.trim());
                    const questions = {
                        temp1Ques: temp1QuesStr,
                        temp2Ques: temp2QuesStr,
                        temp3Ques: temp3QuesStr
                    };
                    const survey = {
                        questions,
                        _id,
                        user_id,
                        title,
                        recipients,
                        maxvalue,
                        minvalue,
                        coltitle
                    };
                    res.json(survey);
                    // let bool = false;
                    // let completed = false;
                    // const uniqueId = [...new Set(results.map(r => r.id))];
                    // const uniqueTitle = [...new Set(results.map(r => r.title))];
                    // const seperateArray = uniqueId.map(u => {
                    //     return results.filter(r => {
                    //         if (r.id === u) {
                    //             return r.questions;
                    //         }
                    //     });
                    // });
                    // const email = seperateArray.map(r => {
                    //     const temp = r.map(a => a.email);
                    //     return temp;
                    // });
                    // const emailId = seperateArray.map(r => {
                    //     const temp = r.map(a => a.survey_recipient_id);
                    //     return temp;
                    // });
                    // const uniqueEmailId = emailId.map(e => [
                    //     ...new Set(e.map(r => r))
                    // ]);
                    // const uniqueEmail = email.map(e => [
                    //     ...new Set(e.map(r => r))
                    // ]);
                    // const questions = seperateArray.map(r => {
                    //     const temp = r.map(a => a.questions);
                    //     return temp;
                    // });
                    // const uniqueQuestions = questions.map(e => [
                    //     ...new Set(e.map(r => r))
                    // ]);
                    // const template = results[0].templateNo;
                    // let j = 0;
                    // const responded = results.map((r, i) => {
                    //     if (
                    //         r.questions === uniqueQuestions[0][j] &&
                    //         r.email === uniqueEmail[0][j]
                    //     ) {
                    //         j++;
                    //         return r.responded === "0" ? false : true;
                    //     }
                    // });
                    // const uniqueResponded = responded.filter(r => {
                    //     return r !== undefined;
                    // });
                    // const recipients = uniqueEmail[0].map((e, i) => {
                    //     if (uniqueEmailId[0][i] == recid) {
                    //         bool = true;
                    //         if (uniqueResponded[i] === true) {
                    //             completed = true;
                    //         }
                    //         return {
                    //             responded: uniqueResponded[i],
                    //             answers: [],
                    //             _id: uniqueEmailId[0][i].toString(),
                    //             email: e
                    //         };
                    //     }
                    // });
                    // const uniqueRecipients = recipients.filter(r => {
                    //     return r !== undefined;
                    // });
                    // const survey = [
                    //     {
                    //         questions: uniqueQuestions[0],
                    //         id: surid,
                    //         title: uniqueTitle[0],
                    //         recipients: uniqueRecipients,
                    //         template
                    //     }
                    // ];
                    // if (Number(template) === 2) {
                    //     survey[0].maxvalue = results[0].maxvalue;
                    //     survey[0].minvalue = results[0].minvalue;
                    // } else if (Number(template) === 3) {
                    //     survey[0].colTitle = results[0].coltitle;
                    // }
                    // if (bool && !completed) {
                    //     res.json(survey[0]);
                    // } else if (bool && completed) {
                    //     res.json({ message: "Response Submitted" });
                    // } else {
                    //     console.log("404");
                    //     res.json({ message: "404 Not Found" });
                    // }
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
    const { recid, surid } = req.params;
    const { a1, a2, a3 } = req.body;
    const toString = ans => {
        let ansString = "";
        ans.forEach((a, i) => {
            if (i === ans.length - 1) {
                ansString += a;
            } else {
                ansString += a + ", ";
            }
        });
        return ansString;
    };
    const ans1String = toString(a1);
    const ans2String = toString(a2);
    const ans3String = toString(a3);

    connection.query(
        "UPDATE survey_recipient SET responded = ?, temp1Ans = ?, temp2Ans = ?, temp3Ans = ? WHERE id = ?",
        ["1", ans1String, ans2String, ans3String, recid],
        (err, results, fields) => {
            if (err) {
                res.json({ message: "Failed To Update" });
            } else {
                res.json({ message: "Updated" });
            }
        }
    );

    // const { answers } = req.body;
    // let finalAnswers = "";
    // answers.forEach((a, i) => {
    //     finalAnswers += a;
    //     if (answers.length - 1 !== i) {
    //         finalAnswers += ", ";
    //     }
    // });
    // connection.query(
    //     "UPDATE survey_recipient SET responded = ?, answers = ? WHERE id = ?",
    //     ["1", finalAnswers, recid],
    //     (err, results, fields) => {
    //         if (err) {
    //             res.json({ message: "Failed To Update" });
    //         } else {
    //             res.json({ message: "Updated" });
    //         }
    //     }
    // );

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
