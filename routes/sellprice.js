var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var db = require('../config/database');
var connection = mysql.createConnection(db);

/* GET sellPrice listing. */
router.get('/', function(req, res, next) {
  connection.query("SELECT * FROM sellPrice", (err,result) => {
    res.send(result);
    if (err) {
      console.log(err);
    }
  })
});

router.post('/new', function(req, res, next) {
    connection.query("INSERT INTO sellPrice SET ?",[req.body], (err,result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    })
  });

  router.put('/edit/:id', function(req, res, next) {
    connection.query(`UPDATE sellPrice SET ? WHERE idSellPrice = ${req.params['id']}`,[req.body], (err,result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    })
  });

  router.delete('/delete/:id', function(req, res, next) {
    connection.query(`DELETE FROM sellPrice WHERE idSellPrice = ${req.params['id']}`,[req.body], (err,result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    })
  });


module.exports = router;
