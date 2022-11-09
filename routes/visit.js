var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var db = require('../config/database');
var connection = mysql.createConnection(db);

/* GET customer listing. */
router.get('/', function (req, res, next) {
    connection.query("SELECT *, DATE_FORMAT(visit.createdAt, '%Y-%m-%d %r') As creationFixedDate FROM visit JOIN user ON visit.createdBy = user.idUser JOIN customer ON customer.idCustomer = visit.customerId JOIN visitCause ON visitCause.idVisitCause = visit.visitCauseId ", (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});

router.get('/user/:id', function (req, res, next) {
    connection.query(`SELECT visit.*, customer.* , visitCause.*,user.*, visit.createdAt as createdAt, "none" as phone, "none" as secondPhone ,DATE_FORMAT(visit.createdAt, '%Y-%m-%d %r') As creationFixedDate, DATE_FORMAT(visit.createdAt, '%W') As creationDayName FROM visit JOIN user ON visit.createdBy = user.idUser JOIN customer ON customer.idCustomer = visit.customerId JOIN visitCause ON visitCause.idVisitCause = visit.visitCauseId WHERE visit.createdBy = ? AND DATE(visit.createdAt) BETWEEN '${req.query.dateFrom}' AND '${req.query.dateTo}'`,[req.params.id], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});

router.post('/', function (req, res, next) {
    connection.query("INSERT INTO visit SET ?", [req.body], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});

router.put('/:id', function (req, res, next) {
    connection.query("UPDATE visit SET ? WHERE idVisit = ?", [req.body, req.params.id], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});


router.delete('/:id', function (req, res, next) {
    connection.query("DELETE FROM visit WHERE idVisit = ?", [req.params.id], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});
module.exports = router;
