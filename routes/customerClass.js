var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var db = require('../config/database');
var connection = mysql.createConnection(db);

/* GET customer listing. */
router.get('/', function (req, res, next) {
    connection.query("SELECT * FROM customerClass", (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});

router.post('/', function (req, res, next) {
    connection.query("INSERT INTO customerClass SET ?", [req.body], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});

router.put('/:id', function (req, res, next) {
    connection.query("UPDATE customerClass SET ? WHERE idCustomerClass = ?", [req.body, req.params.id], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});


router.delete('/:id', function (req, res, next) {
    connection.query("DELETE FROM customerClass WHERE idCustomerClass = ?", [req.params.id], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});
module.exports = router;
