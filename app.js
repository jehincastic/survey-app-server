const express = require("express"),
    bodyParser = require("body-parser"),
    cors = require("cors"),
    mongoose = require("mongoose"),
    indexRoutes = require("./routes/index"),
    surveyRoutes = require("./routes/survey"),
    keys = require("./keys/keys"),
    app = express();

mongoose.connect(keys.DBlink, { useNewUrlParser: true });
mongoose.set("useFindAndModify", false);
app.use(bodyParser.json());
app.use(cors());

app.use(indexRoutes);
app.use("/survey", surveyRoutes);

app.listen(process.env.PORT, process.env.IP, function() {
    console.log("Listening on 4000");
});
