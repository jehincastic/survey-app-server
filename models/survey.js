const mongoose = require("mongoose");
const Recipient = require("./recipient");

const surveySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    title: String,
    questions: [String],
    recipients: [Recipient],
    template: Number,
    maxvalue: String,
    minvalue: String,
    colTitle: String
});

module.exports = mongoose.model("Survey", surveySchema);
