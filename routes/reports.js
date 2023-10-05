var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var db = require("../config/database");
var connection = mysql.createConnection(db);

/* GET sellPrice listing. */
router.get("/", function (req, res, next) {
  res.sendStatus(200);
});

/// NOT FINISHED YET

router.get("/overview", function (req, res, next) {
  if (req.query.days == null || req.query.days == undefined) {
    req.query.days =
      "'sunday','monday','tuesday','wednesday','thursday','friday','saturday'";
  }
  var query = "";
  if (
    req.query.from == undefined ||
    req.query.from == null ||
    req.query.to == undefined ||
    req.query.to == null
  ) {
    var today = new Date();
    var date1 =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate();
    var date2 =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate();
  } else {
    var date1 = req.query.from;
    var date2 = req.query.to;
  }

  if (req.query.superVisorId != undefined) {
    query = query + " AND @superVisorId = " + req.query.superVisorId;
  }
  if (req.query.delegateId != undefined) {
    query = query + " AND idUser IN (" + req.query.delegateId + ")";
  }
  connection.query(
    `SELECT * ,'******' As password , (SELECT @totalSelling := IFNULL(SUM(invoiceContent.total),0) FROM invoiceContent JOIN invoice ON invoice.idInvoice = invoiceContent.invoiceId WHERE invoice.createdBy = user.idUser AND invoice.invoiceTypeId = 1 AND DATE(invoice.createdAt) BETWEEN '${date1}' AND '${date2}') As totalSelling , (SELECT @totalRestores := IFNULL(SUM(invoiceContent.total),0) FROM invoiceContent JOIN invoice ON invoice.idInvoice = invoiceContent.invoiceId WHERE invoice.createdBy = user.idUser AND invoice.invoiceTypeId = 3 AND DATE(invoice.createdAt) BETWEEN '${date1}' AND '${date2}') As totalRestores, (SELECT IFNULL(COUNT(idCustomer),0) FROM customer WHERE createdBy = user.idUser AND isManufacture = 0 AND visitDay IN (${req.query.days})) As totalCustomers, (SELECT COUNT(idVisit) FROM visit WHERE createdBy = user.idUser AND DATE(visit.createdAt) BETWEEN '${date1}' AND '${date2}') As totalVisits, (SELECT COUNT(idCustomer) FROM customer WHERE createdBy = user.idUser AND visitDay IN (${req.query.days}) AND (SELECT COUNT(idInvoice) FROM invoice WHERE invoice.createdBy = user.idUser AND customerId = customer.idCustomer) > 0) As activeCustomers, (SELECT @superVisorId := IFNULL(superVisorId,0) FROM supervisorDelegates WHERE delegateId = user.idUser LIMIT 1) As superVisorId , (SELECT username FROM user WHERE idUser = @superVisorId) As superVisorName, (SELECT IFNULL(COUNT(idInvoice),0) FROM invoice WHERE createdBy = user.idUser AND DATE(invoice.createdAt) BETWEEN '${date1}' AND '${date2}' AND invoice.invoiceTypeId = 1) As invoicesCount, (SELECT IFNULL(COUNT(idInvoice),0) FROM invoice WHERE createdBy = user.idUser AND DATE(invoice.createdAt) BETWEEN '${date1}' AND '${date2}' AND invoice.invoiceTypeId = 3) As restoresCount , (@totalSelling - @totalRestores) As totalRemaining, (SELECT IFNULL(SUM((invoiceContent.count * invoiceContent.price)),0) FROM invoiceContent JOIN invoice ON invoiceContent.invoiceId = invoice.idInvoice WHERE invoiceContent.discountTypeId = 1 AND invoice.createdBy = user.idUser AND DATE(invoice.createdAt) BETWEEN '${date1}' AND '${date2}') As totalGifts , (SELECT IFNULL(SUM((invoiceContent.count * invoiceContent.price)),0) FROM invoiceContent JOIN invoice ON invoiceContent.invoiceId = invoice.idInvoice WHERE invoiceContent.discountTypeId = 7 AND invoice.createdBy = user.idUser AND DATE(invoice.createdAt) BETWEEN '${date1}' AND '${date2}') As totalOffers, IFNULL((SELECT SUM(totalPrice) FROM damagedItemsInvoiceContents JOIN damagedItemsInvoice ON damagedItemsInvoiceContents.damagedItemsInvoiceId = damagedItemsInvoice.idDamagedItemsInvoice WHERE damagedItemsInvoice.createdBy = user.idUser AND DATE(damagedItemsInvoice.createdAt) BETWEEN '${date1}' AND '${date2}'),0) As totalDamaged FROM user JOIN userInfo ON userInfo.userId = user.idUser JOIN sellPrice ON sellPrice.idSellPrice = userInfo.sellPriceId WHERE roleId IN (4,3) ${query}`,
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.get("/delegateItems/:id", function (req, res, next) {
  connection.query(
    `SELECT IFNULL(SUM(invoiceContent.total),0) As totalPrice, IFNULL(SUM(invoiceContent.count),0) As totalCount, (SELECT  IFNULL(CONCAT(itemType , ' ' , itemName,' ' , itemWeight, ' ' ,itemWeightSuffix, ' ' , ' * ' ,  ' ' , brand.brandName), item.itemName)  FROM item LEFT JOIN itemGroup ON item.itemGroupId = itemGroup.idItemGroup LEFT JOIN brand ON item.brandId = brand.idBrand LEFT JOIN itemType ON itemType.idItemType = item.itemTypeId  WHERE invoiceContent.itemId = item.idItem LIMIT 1) As itemName FROM invoiceContent JOIN invoice ON invoiceContent.invoiceId = invoice.idInvoice WHERE DATE(invoice.createdAt) = '${req.query.date}' AND invoice.createdBy = ${req.params.id} AND invoice.invoiceTypeId = ${req.query.type} GROUP BY invoiceContent.itemId ORDER BY totalCount DESC`,
    (err, result) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
      } else {
        res.send(result);
      }
    },
  );
});
router.get("/delegateDamagedItems/:id", function (req, res, next) {
  connection.query(
    `SELECT IFNULL(SUM(damagedItemsInvoiceContents.totalPrice),0) As totalPrice, IFNULL(SUM(damagedItemsInvoiceContents.count),0) As totalCount, (SELECT  IFNULL(CONCAT(itemType , ' ' , itemName,' ' , itemWeight, ' ' ,itemWeightSuffix, ' ' , ' * ' ,  ' ' , brand.brandName), item.itemName)  FROM item LEFT JOIN itemGroup ON item.itemGroupId = itemGroup.idItemGroup LEFT JOIN brand ON item.brandId = brand.idBrand LEFT JOIN itemType ON itemType.idItemType = item.itemTypeId  WHERE damagedItemsInvoiceContents.itemId = item.idItem LIMIT 1) As itemName FROM damagedItemsInvoiceContents JOIN damagedItemsInvoice ON damagedItemsInvoiceContents.damagedItemsInvoiceId = damagedItemsInvoice.idDamagedItemsInvoice WHERE DATE(damagedItemsInvoice.createdAt) = '${req.query.date}' AND damagedItemsInvoice.createdBy = ${req.params.id} GROUP BY damagedItemsInvoiceContents.itemId ORDER BY totalCount DESC`,
    (err, result) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
      } else {
        res.send(result);
      }
    },
  );
});

router.get("/delegateRail/:id", function (req, res, next) {
  let sort = "";
  if (req.query.sort != undefined) {
    sort = "ORDER BY lastInvoice DESC";
  }
  connection.query(
    `SELECT *,DATE_FORMAT(customer.createdAt, '%Y-%m-%d %r') As customerCreatedAt, (SELECT IFNULL(SUM(total),0) FROM invoiceContent JOIN invoice ON invoiceContent.invoiceId = invoice.idInvoice WHERE invoice.customerId = customer.idCustomer AND invoice.invoiceTypeId = 1 AND DATE(invoice.createdAt) BETWEEN '${req.query.date1}' AND '${req.query.date2}') AS totalSell, (SELECT IFNULL(SUM(total),0) FROM invoiceContent JOIN invoice ON invoiceContent.invoiceId = invoice.idInvoice WHERE invoice.customerId = customer.idCustomer AND invoice.invoiceTypeId = 3 AND DATE(invoice.createdAt) BETWEEN '${req.query.date1}' AND '${req.query.date2}') AS totalRestore, (SELECT createdAt FROM invoice WHERE invoice.customerId = customer.idCustomer ORDER BY idInvoice DESC LIMIT 1) As lastInvoice, (SELECT IFNULL(COUNT(idInvoice),0) FROM invoice WHERE invoice.customerId = customer.idCustomer AND invoice.invoiceTypeId = 1 AND DATE(invoice.createdAt) BETWEEN '${req.query.date1}' AND '${req.query.date2}') As totalInvoiceCount, (SELECT IFNULL(COUNT(idVisit),0) FROM visit WHERE visit.customerId = customer.idCustomer AND DATE(visit.createdAt) BETWEEN '${req.query.date1}' AND '${req.query.date2}') As visitCount FROM customer JOIN customerClass ON customer.customerClassId = customerClass.idCustomerClass WHERE createdBy = ${req.params.id} ${sort}`,
    (err, result) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
      } else {
        res.send(result);
      }
    },
  );
});

router.get("/itemRail/:id", function (req, res, next) {
  connection.query(
    `SELECT *,(SELECT username FROM user WHERE idUser = invoice.createdBy LIMIT 1) As delegateName, DATE_FORMAT(invoice.createdAt, '%Y-%m-%d %r') As creationFixedDate FROM invoiceContent JOIN invoice ON invoice.idInvoice = invoiceContent.invoiceId LEFT JOIN customer ON customer.idCustomer = invoice.customerId LEFT JOIN item on item.idItem = invoiceContent.itemId WHERE invoiceContent.itemId = ${req.params.id} AND DATE(invoice.createdAt) BETWEEN '${req.query.date1}' AND '${req.query.date2}'`,
    (err, result) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
      } else {
        res.send(result);
      }
    },
  );
});

module.exports = router;
