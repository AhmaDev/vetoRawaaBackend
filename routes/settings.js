var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var db = require("../config/database");
var connection = mysql.createConnection(db);

router.get("/", function (req, res) {
  connection.query("SELECT * FROM settings", function (err, result) {
    res.send(result);
  });
});

router.get("/appVersion", function (req, res) {
  connection.query(
    'SELECT * FROM settings WHERE variable = "appVersion"',
    function (err, result) {
      res.send({ version: result[0].value });
    },
  );
});

router.put("/", function (req, res) {
  connection.query('UPDATE settings SET value = ? WHERE variable = "title"', [
    req.body.title,
  ]);
  connection.query(
    'UPDATE settings SET value = ? WHERE variable = "workStartTime"',
    [req.body.workStartTime],
  );
  connection.query(
    'UPDATE settings SET value = ? WHERE variable = "workEndTime"',
    [req.body.workEndTime],
  );
  connection.query(
    'UPDATE settings SET value = ? WHERE variable = "daysToRestoreInvoices"',
    [req.body.daysToRestoreInvoices],
  );
  connection.query(
    'UPDATE settings SET value = ? WHERE variable = "reportsDays"',
    [req.body.reportsDays],
  );
  res.send("OK");
});

module.exports = router;
