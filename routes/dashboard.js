var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var db = require("../config/database");
var connection = mysql.createConnection(db);

router.get("/statistics", function (req, res, next) {
  connection.query(
    "SELECT COUNT(idCustomer) As totalCustomers FROM customer",
    (errCustomer, resultCustomer) => {
      connection.query(
        "SELECT COUNT(idItem) As totalItems FROM item",
        (errItem, resultItem) => {
          connection.query(
            "SELECT COUNT(idUser) As totalUsers FROM user",
            (errUser, resultUser) => {
              connection.query(
                "SELECT COUNT(idInvoice) As totalInvoices FROM invoice",
                (errInvoice, resultInvoice) => {
                  res.send({
                    totalCustomers: resultCustomer[0].totalCustomers,
                    totalInvoices: resultInvoice[0].totalInvoices,
                    totalItems: resultItem[0].totalItems,
                    totalUsers: resultUser[0].totalUsers,
                  });
                },
              );
            },
          );
        },
      );
    },
  );
});

router.get("/userSales/:id", function (req, res, next) {
  connection.query(
    `SELECT IFNULL(SUM(invoiceContent.total),0) As total FROM invoiceContent JOIN invoice ON invoiceContent.invoiceId = invoice.idInvoice WHERE MONTH(invoice.createdAt) = MONTH(CURRENT_DATE()) AND YEAR(invoice.createdAt) = YEAR(CURRENT_DATE()) AND invoice.createdBy = ${req.params.id} AND invoice.invoiceTypeId = 1`,
    (err, result) => {
      res.send(result[0]);
    },
  );
});

router.get("/userRestores/:id", function (req, res, next) {
  connection.query(
    `SELECT IFNULL(SUM(invoiceContent.total),0) As total FROM invoiceContent JOIN invoice ON invoiceContent.invoiceId = invoice.idInvoice WHERE MONTH(invoice.createdAt) = MONTH(CURRENT_DATE()) AND YEAR(invoice.createdAt) = YEAR(CURRENT_DATE()) AND invoice.createdBy = ${req.params.id} AND invoice.invoiceTypeId = 3`,
    (err, result) => {
      res.send(result[0]);
    },
  );
});

router.get("/userDamaged/:id", function (req, res, next) {
  connection.query(
    `SELECT IFNULL(SUM(damagedItemsInvoiceContents.totalPrice),0) As total FROM damagedItemsInvoiceContents JOIN damagedItemsInvoice ON damagedItemsInvoiceContents.damagedItemsInvoiceId = damagedItemsInvoice.idDamagedItemsInvoice WHERE MONTH(damagedItemsInvoice.createdAt) = MONTH(CURRENT_DATE()) AND YEAR(damagedItemsInvoice.createdAt) = YEAR(CURRENT_DATE()) AND damagedItemsInvoice.createdBy = ${req.params.id}`,
    (err, result) => {
      res.send(result[0]);
    },
  );
});

router.get("/mostSellingDelegates", function (req, res) {
  if (req.query.date == undefined || req.query.date == null) {
    var today = new Date();
    var date =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate();
  } else {
    date = req.query.date;
  }
  connection.query(
    `SELECT idUser,username, (SELECT @total := IFNULL(sum(invoiceContent.total), 0) FROM invoiceContent JOIN invoice ON invoice.idInvoice = invoiceContent.invoiceId WHERE invoice.createdBy = user.idUser AND DATE(invoice.createdAt) = '${date}') As total FROM user LIMIT 7`,
    (err, result) => {
      if (result.length > 0) {
        res.send(result.sort((a, b) => (b.total > a.total ? 1 : -1)));
      } else {
        res.send([]);
      }
    },
  );
});

router.get("/mostSellingItems", function (req, res) {
  if (req.query.date == undefined || req.query.date == null) {
    var today = new Date();
    var date =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate();
  } else {
    date = req.query.date;
  }
  connection.query(
    `SELECT idItem,itemName,IFNULL(CONCAT(itemType , ' ' , itemName,' ' , itemWeight, ' ' ,itemWeightSuffix, ' ' , ' * ' ,  ' ' , brand.brandName), item.itemName) As fullItemName, (SELECT @total := IFNULL(sum(invoiceContent.total), 0) FROM invoiceContent JOIN invoice ON invoice.idInvoice = invoiceContent.invoiceId WHERE invoiceContent.itemId = item.idItem AND DATE(invoice.createdAt) = '${date}') As total FROM item LEFT JOIN itemGroup ON item.itemGroupId = itemGroup.idItemGroup LEFT JOIN brand ON item.brandId = brand.idBrand LEFT JOIN itemType ON itemType.idItemType = item.itemTypeId LIMIT 7`,
    (err, result) => {
      if (result.length > 0) {
        res.send(result.sort((a, b) => (b.total > a.total ? 1 : -1)));
      } else {
        res.send([]);
      }
    },
  );
});

module.exports = router;
