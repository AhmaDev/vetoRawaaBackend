var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var db = require('../config/database');
var connection = mysql.createConnection(db);

router.get('/', function(req, res) {
    connection.query('SELECT * FROM permission', function(err,result) {
        res.send(result)
    })
})


router.get('/role', function(req, res) {
    connection.query('SELECT * FROM rolePermissions JOIN permission ON rolePermissions.permissionId = permission.idPermission', function(err,result) {
        res.send(result)
    })
})

router.get('/role/:roleId', function(req, res) {
    connection.query('SELECT * FROM rolePermissions JOIN permission ON rolePermissions.permissionId = permission.idPermission WHERE roleId = ?',[req.params.roleId], function(err,result) {
        res.send(result)
    })
})

router.get('/user', function(req, res) {
    connection.query('SELECT * FROM userPermissions', function(err,result) {
        res.send(result)
    })
})

router.post('/', function(req, res) {
    if (req.body.value == true) {
        connection.query(`INSERT INTO rolePermissions (roleId,permissionId) VALUES (${req.body.roleId},${req.body.permissionId})`, function(err,result) {
            res.send(result)
        })
    } else {
        connection.query(`DELETE FROM rolePermissions WHERE roleId = ${req.body.roleId} AND permissionId = ${req.body.permissionId}`, function(err,result) {
            res.send(result)
        })
    }
})
module.exports = router;
