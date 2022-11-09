var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var db = require("../config/database");
var connection = mysql.createConnection(db);

/* GET discount listing. */
router.get("/", function (req, res, next) {
  connection.query("SELECT * FROM discount", (err, result) => {
    res.send(result);
    if (err) {
      console.log(err);
    }
  });
});

router.get("/items", function (req, res, next) {
  let dateQuery = "";

  if (req.query.from != undefined) {
    dateQuery = `AND DATE(invoice.createdAt) BETWEEN '${req.query.from}' AND '${req.query.to}'`;
  }
  connection.query(
    `SELECT user.username,user.idUser, customer.idCustomer, customer.storeName, invoiceContent.*, discount.*,IFNULL(CONCAT(itemType , ' ' , itemName,' ' , itemWeight, ' ' ,itemWeightSuffix, ' ' , ' * ' , cartonQauntity , ' ' , brand.brandName), item.itemName) As fullItemName,item.imagePath,DATE_FORMAT(invoice.createdAt, '%Y-%m-%d') As creationFixedDate, DATE_FORMAT(invoice.createdAt, '%r') As creationFixedTime, DATE_FORMAT(invoice.createdAt, '%W') As creationDayName , SUM(count) As count, (SELECT IFNULL(SUM(count),0) FROM invoiceContent AS subInvoiceContent WHERE subInvoiceContent.itemId = invoiceContent.itemId AND subInvoiceContent.invoiceId = invoiceContent.invoiceId AND subInvoiceContent.discountTypeId = 0) As notFreeCount, (SELECT IFNULL(SUM(total),0) FROM invoiceContent AS subInvoiceContent WHERE subInvoiceContent.invoiceId = invoiceContent.invoiceId) As totalPrice, (SELECT IFNULL(SUM(total),0) FROM invoiceContent AS subInvoiceContent JOIN invoice  ON invoice.idInvoice = subInvoiceContent.invoiceId WHERE DATE(invoice.createdAt) BETWEEN '${req.query.from}' AND '${req.query.to}' AND invoice.createdBy = user.idUser AND invoice.invoiceTypeId = 1) As totalInvoicesPrice FROM invoiceContent JOIN item ON item.idItem = invoiceContent.itemId LEFT JOIN brand ON item.brandId = brand.idBrand LEFT JOIN itemType ON itemType.idItemType = item.itemTypeId JOIN invoice ON invoiceContent.invoiceId = invoice.idInvoice LEFT JOIN discount ON invoiceContent.discountTypeId = discount.idDiscount LEFT JOIN customer ON customer.idCustomer = invoice.customerId JOIN user ON user.idUser = invoice.createdBy WHERE invoiceContent.discountTypeId != 0 ${dateQuery} GROUP BY invoice.idInvoice, invoiceContent.itemId ,discountTypeId`,
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.post("/new", function (req, res, next) {
  connection.query("INSERT INTO discount SET ?", [req.body], (err, result) => {
    res.send(result);
    if (err) {
      console.log(err);
    }
  });
});

router.put("/edit/:id", function (req, res, next) {
  connection.query(
    `UPDATE discount SET ? WHERE idDiscount = ${req.params["id"]}`,
    [req.body],
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

// router.delete('/delete/:id', function(req, res, next) {
//   connection.query(`DELETE FROM discount WHERE idDiscount = ${req.params['id']}`,[req.body], (err,result) => {
//     res.send(result);
//     if (err) {
//       console.log(err);
//     }
//   })
// });

module.exports = router;
