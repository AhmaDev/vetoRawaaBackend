var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var db = require('../config/database');
var connection = mysql.createConnection(db);

/* GET customer listing. */
router.get('/', function (req, res, next) {
    connection.query("SELECT * FROM customer JOIN sellPrice ON customer.sellPriceId = sellPrice.idSellPrice WHERE isManufacture = 1", (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});



router.get('/:id', function (req, res, next) {
    connection.query("SELECT * FROM customer JOIN sellPrice ON customer.sellPriceId = sellPrice.idSellPrice WHERE idCustomer = ? AND isManufacture = 1", [req.params.id], (err, result) => {
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


router.get('/user/:id', function (req, res, next) {
    connection.query("SELECT * FROM customer JOIN sellPrice ON customer.sellPriceId = sellPrice.idSellPrice WHERE createdBy = ? AND isManufacture = 1", [req.params.id], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});

router.get('/filter/query', function (req, res, next) {

    let query = '';
    let order = '';
    let limit = '';

    if (req.query.id != undefined) {
        query = query + ` AND idCustomer = ${req.query.id}`
    }
    if (req.query.dateRangeFrom != undefined && req.query.dateRangeTo != undefined) {
        query = query + ` AND DATE(createdAt) BETWEEN '${req.query.dateRangeFrom}' AND '${req.query.dateRangeTo}'`
    }

    if (req.query.user != undefined) {
        query = query + ` AND createdBy IN (${req.query.user})`
    }

    if (req.query.visitDay != undefined) {
        query = query + ` AND (visitDay = '${req.query.visitDay}' OR secondVisitDay = '${req.query.visitDay}')`
    }

    if (req.query.order != undefined) {
        order = 'ORDER BY ' + req.query.order + ' ' + req.query.sort
    }

    if (req.query.limit != undefined) {
        limit = `LIMIT ${req.query.limit}`
    }

    connection.query(`SELECT * FROM customer JOIN sellPrice ON customer.sellPriceId = sellPrice.idSellPrice WHERE isManufacture = 1 ${query} ${order} ${limit}`, (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});


router.get('/search/:userId', function (req, res, next) {
    connection.query(`SELECT * FROM customer JOIN sellPrice ON customer.sellPriceId = sellPrice.idSellPrice WHERE storeName LIKE '%${req.query.name}%' AND createdBy = ${req.params.userId} AND isManufacture = 1 LIMIT 15`, (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});

router.post('/new', function (req, res, next) {
    connection.query("INSERT INTO customer SET ?", [req.body], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});

router.put('/edit/:id', function (req, res, next) {
    connection.query(`UPDATE customer SET ? WHERE idCustomer = ${req.params['id']}`, [req.body], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});

router.put('/edit/multiple/:id', function (req, res, next) {
    connection.query(`UPDATE customer SET ? WHERE idCustomer in (${req.params['id']})`, [req.body], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});

router.delete('/delete/:id', function (req, res, next) {
    connection.query(`DELETE FROM customer WHERE idCustomer = ${req.params['id']}`, [req.body], (err, result) => {
        res.send(result);
        if (err) {
            console.log(err);
        }
    })
});


module.exports = router;
