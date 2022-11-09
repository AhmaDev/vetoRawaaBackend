const fs = require('fs');
var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var db = require('../config/database');
var connection = mysql.createConnection(db);
const dirRoot = require('../app')
var multer  = require('multer')
var path = require('path')
var mime = require('mime-types')

router.get("/uploads/:file", function (request, response) {
    console.log(dirRoot);
    let file = request.params.file;
    var extension = file.split(".").pop();
    var tempFile = path.join(__dirname,'..', 'uploads/' + file)
    console.log(dirRoot);
    fs.readFile(tempFile, function (err, data) {
       console.log(err);
       switch (extension) {
          case "jpg":
             contentType = "image/jpg";
             isImage = 1;
             break;
          case "png":
             contentType = "image/png";
             isImage = 1;
             break;
          case "pdf":
             contentType = "application/pdf";
             isImage = 2;
             break;
          case "jpeg":
            contentType = "image/jpeg";
            isImage = 1;
            break;
       }
       response.contentType(contentType);
       response.send(data);
    });
 });


 router.get("/uploads/customer/:file", function (request, response) {
   console.log(dirRoot);
   let file = request.params.file;
   var extension = file.split(".").pop();
   var tempFile = path.join(__dirname,'..', 'uploads/customer/' + file)
   console.log(dirRoot);
   fs.readFile(tempFile, function (err, data) {
      console.log(err);
      switch (extension) {
         case "jpg":
            contentType = "image/jpg";
            isImage = 1;
            break;
         case "png":
            contentType = "image/png";
            isImage = 1;
            break;
         case "pdf":
            contentType = "application/pdf";
            isImage = 2;
            break;
         case "jpeg":
           contentType = "image/jpeg";
           isImage = 1;
           break;
      }
      response.contentType(contentType);
      response.send(data);
   });
});

 module.exports = router;
