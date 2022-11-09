var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var db = require('../config/database');
var connection = mysql.createConnection(db);

/* GET itemGroup listing. */
router.get('/', function (req, res, next) {
    connection.query("SELECT * FROM itemGroup", (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});

router.get('/:id', function (req, res, next) {
    connection.query("SELECT * FROM itemGroup WHERE idItemGroup = ?", [req.params.id], (err, result) => {
        if (result.length > 0) {
            res.send(result[0]);
        } else {
            res.sendStatus(404)
        }
        if (err) {
            console.log(err);
        }
    })
});

router.post('/new', function (req, res, next) {
    connection.query("INSERT INTO itemGroup SET ?", [req.body], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});

router.put('/edit/:id', function (req, res, next) {
    connection.query(`UPDATE itemGroup SET ? WHERE idItemGroup = ${req.params['id']}`, [req.body], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});

router.delete('/delete/:id', function (req, res, next) {
    connection.query(`DELETE FROM itemGroup WHERE idItemGroup = ${req.params['id']}`, [req.body], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});


module.exports = router;
