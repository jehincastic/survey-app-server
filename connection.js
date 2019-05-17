const mysql = require("mysql");
    keys = require("./keys/keys");

module.exports = mysql.createConnection({
    host: keys.DB_HOST,
    user: keys.DB_USER,
    password: keys.DB_PWD,
    database: keys.DB_NAME
});
