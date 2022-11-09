var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var db = require('../config/database');
var connection = mysql.createConnection(db);

/* GET discount listing. */
router.get('/', function (req, res, next) {
    connection.query("SELECT * FROM deliveryDelegates", (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});

router.get('/userid/:id', function (req, res, next) {
    connection.query(`SELECT *, (SELECT username FROM user WHERE idUser = deliveryDelegates.delegateId) As delegateName FROM deliveryDelegates WHERE deliveryId = ?`, [req.params.id], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});

router.post('/new', function (req, res, next) {
    connection.query("INSERT INTO deliveryDelegates SET ?", [req.body], (err, result) => {

        if (err) {
            console.log(err);
            res.sendStatus(409)
        } else {
            res.send(result);
        }
    })
});

router.put('/edit/:id', function (req, res, next) {
    connection.query(`UPDATE deliveryDelegates SET ? WHERE idDeliveryDelegates = ${req.params['id']}`, [req.body], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});

router.delete('/delete/:id', function (req, res, next) {
    connection.query(`DELETE FROM deliveryDelegates WHERE idDeliveryDelegates = ${req.params['id']}`, [req.body], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});


module.exports = router;
