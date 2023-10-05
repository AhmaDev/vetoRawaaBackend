var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var db = require("../config/database");
var connection = mysql.createConnection(db);

/* GET customer listing. */
router.get("/", function (req, res, next) {
  connection.query(
    "SELECT * ,(SELECT storeName FROM customer WHERE idCustomer = damagedItemsInvoice.customerId) As customerName,DATE_FORMAT(createdAt, '%Y-%m-%d') As creationFixedDate, DATE_FORMAT(createdAt, '%T') As creationFixedTime, DATE_FORMAT(createdAt, '%W') As creationDayName, (SELECT username FROM user WHERE idUser = damagedItemsInvoice.createdBy) As createdByName FROM damagedItemsInvoice ORDER BY idDamagedItemsInvoice DESC",
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.get("/id/:id", function (req, res, next) {
  connection.query(
    "SELECT * ,(SELECT storeName FROM customer WHERE idCustomer = damagedItemsInvoice.customerId) As customerName,DATE_FORMAT(createdAt, '%Y-%m-%d') As creationFixedDate, DATE_FORMAT(createdAt, '%T') As creationFixedTime, DATE_FORMAT(createdAt, '%W') As creationDayName ,IFNULL((SELECT JSON_ARRAYAGG(json_object('itemId',itemId,'count',count,'idDamagedItemsInvoiceContents',idDamagedItemsInvoiceContents,'itemName',(SELECT  IFNULL(CONCAT(itemType , ' ' , itemName,' ' , itemWeight, ' ' ,itemWeightSuffix, ' ' , ' * ' ,  ' ' , brand.brandName), item.itemName)  FROM item LEFT JOIN itemGroup ON item.itemGroupId = itemGroup.idItemGroup LEFT JOIN brand ON item.brandId = brand.idBrand LEFT JOIN itemType ON itemType.idItemType = item.itemTypeId WHERE idItem = damagedItemsInvoiceContents.itemId LIMIT 1), 'price', price, 'totalPrice', totalPrice)) FROM damagedItemsInvoiceContents WHERE damagedItemsInvoiceContents.damagedItemsInvoiceId = damagedItemsInvoice.idDamagedItemsInvoice),'[]') As items FROM damagedItemsInvoice WHERE idDamagedItemsInvoice = " +
      req.params.id,
    (err, result) => {
      console.log(err);
      if (result.length > 0) {
        result = result.map(
          (row) => ((row.items = JSON.parse(row.items)), row),
        );
        res.send(result[0]);
      } else {
        res.sendStatus(404);
      }
    },
  );
});

router.get("/user/:id", function (req, res, next) {
  connection.query(
    `SELECT * ,(SELECT storeName FROM customer WHERE idCustomer = damagedItemsInvoice.customerId) As customerName,DATE_FORMAT(createdAt, '%Y-%m-%d') As creationFixedDate, DATE_FORMAT(createdAt, '%T') As creationFixedTime, DATE_FORMAT(createdAt, '%W') As creationDayName, (SELECT IFNULL(SUM(totalPrice),0) FROM damagedItemsInvoiceContents WHERE damagedItemsInvoiceContents.damagedItemsInvoiceId = damagedItemsInvoice.idDamagedItemsInvoice) As total FROM damagedItemsInvoice WHERE DATE(damagedItemsInvoice.createdAt) = '${req.query.date}' AND damagedItemsInvoice.createdBy IN (${req.params.id}) ORDER BY damagedItemsInvoice.createdBy, damagedItemsInvoice.idDamagedItemsInvoice`,
    (err, result) => {
      console.log(err);
      if (result.length > 0) {
        res.send(result);
      } else {
        res.sendStatus(404);
      }
    },
  );
});

router.get("/filter", function (req, res, next) {
  let query = "";
  let order = "";
  let limit = "";

  if (req.query.id != undefined) {
    query = query + ` AND idDamagedItemsInvoice = ${req.query.id}`;
  }

  if (req.query.date != undefined) {
    query = query + ` AND DATE(createdAt) = '${req.query.date}'`;
  }

  if (
    req.query.dateRangeFrom != undefined &&
    req.query.dateRangeTo != undefined
  ) {
    query =
      query +
      ` AND DATE(createdAt) BETWEEN '${req.query.dateRangeFrom}' AND '${req.query.dateRangeTo}'`;
  }

  if (req.query.user != undefined) {
    query = query + ` AND createdBy IN (${req.query.user})`;
  }

  if (req.query.customer != undefined) {
    query = query + ` AND customerId IN (${req.query.customer})`;
  }

  if (req.query.order != undefined) {
    order = "ORDER BY " + req.query.order + " " + req.query.sort;
  }

  if (req.query.limit != undefined) {
    limit = `LIMIT ${req.query.limit}`;
  }

  connection.query(
    `SELECT * ,(SELECT customerName FROM customer WHERE idCustomer = damagedItemsInvoice.customerId) As customerName ,(SELECT storeName FROM customer WHERE idCustomer = damagedItemsInvoice.customerId) As storeName , (SELECT IFNULL(SUM(totalPrice),0) FROM damagedItemsInvoiceContents WHERE damagedItemsInvoiceContents.damagedItemsInvoiceId = damagedItemsInvoice.iDdamagedItemsInvoice) As totalPrice , DATE_FORMAT(createdAt, '%Y-%m-%d') As creationFixedDate, DATE_FORMAT(createdAt, '%T') As creationFixedTime, DATE_FORMAT(createdAt, '%W') As creationDayName, (SELECT username FROM user WHERE idUser = damagedItemsInvoice.createdBy) As createdByName FROM damagedItemsInvoice WHERE 1=1 ${query} ${order} ${limit}`,
    (err, result) => {
      res.send(result);
      console.log(err);
    },
  );
});

router.get("/customer/:id", function (req, res, next) {
  connection.query(
    `SELECT * ,(SELECT storeName FROM customer WHERE idCustomer = damagedItemsInvoice.customerId) As customerName,DATE_FORMAT(createdAt, '%Y-%m-%d') As creationFixedDate, DATE_FORMAT(createdAt, '%T') As creationFixedTime, DATE_FORMAT(createdAt, '%W') As creationDayName, (SELECT SUM(totalPrice) FROM damagedItemsInvoiceContents WHERE damagedItemsInvoiceContents.damagedItemsInvoiceId = damagedItemsInvoice.idDamagedItemsInvoice) As total FROM damagedItemsInvoice WHERE DATE(damagedItemsInvoice.createdAt) = '${req.query.date}' AND damagedItemsInvoice.customerId IN (${req.params.id})`,
    (err, result) => {
      console.log(err);
      if (result.length > 0) {
        res.send(result);
      } else {
        res.sendStatus(404);
      }
    },
  );
});

router.get("/userDateRange/:id", function (req, res, next) {
  connection.query(
    `SELECT * ,(SELECT storeName FROM customer WHERE idCustomer = damagedItemsInvoice.customerId) As customerName,(SELECT visitDay FROM customer WHERE idCustomer = damagedItemsInvoice.customerId) As visitDay,DATE_FORMAT(createdAt, '%Y-%m-%d') As creationFixedDate, DATE_FORMAT(createdAt, '%T') As creationFixedTime, DATE_FORMAT(createdAt, '%W') As creationDayName, (SELECT SUM(totalPrice) FROM damagedItemsInvoiceContents WHERE damagedItemsInvoiceContents.damagedItemsInvoiceId = damagedItemsInvoice.idDamagedItemsInvoice) As total FROM damagedItemsInvoice WHERE damagedItemsInvoice.createdBy IN (${req.params.id}) AND DATE(damagedItemsInvoice.createdAt) BETWEEN '${req.query.from}' AND '${req.query.to}'`,
    (err, result) => {
      console.log(err);
      if (result.length > 0) {
        res.send(result);
      } else {
        res.sendStatus(404);
      }
    },
  );
});

router.post("/multiple", function (req, res, next) {
  connection.query(
    "SELECT * , (SELECT username FROM user WHERE idUser = damagedItemsInvoice.createdBy) As createdByName ,(SELECT storeName FROM customer WHERE idCustomer = damagedItemsInvoice.customerId) As customerName,DATE_FORMAT(damagedItemsInvoice.createdAt, '%Y-%m-%d') As creationFixedDate, DATE_FORMAT(damagedItemsInvoice.createdAt, '%T') As creationFixedTime, DATE_FORMAT(damagedItemsInvoice.createdAt, '%W') As creationDayName ,IFNULL((SELECT JSON_ARRAYAGG(json_object('itemId',itemId,'count',count,'idDamagedItemsInvoiceContents',idDamagedItemsInvoiceContents,'itemName',(SELECT  IFNULL(CONCAT(itemType , ' ' , itemName,' ' , itemWeight, ' ' ,itemWeightSuffix, ' ' , ' * ' ,  ' ' , brand.brandName), item.itemName)  FROM item LEFT JOIN itemGroup ON item.itemGroupId = itemGroup.idItemGroup LEFT JOIN brand ON item.brandId = brand.idBrand LEFT JOIN itemType ON itemType.idItemType = item.itemTypeId WHERE idItem = damagedItemsInvoiceContents.itemId LIMIT 1), 'price', price, 'totalPrice', totalPrice)) FROM damagedItemsInvoiceContents WHERE damagedItemsInvoiceContents.damagedItemsInvoiceId = damagedItemsInvoice.idDamagedItemsInvoice),'[]') As items FROM damagedItemsInvoice JOIN customer ON customer.idCustomer = damagedItemsInvoice.customerId JOIN province ON province.idProvince = customer.provinceId WHERE idDamagedItemsInvoice IN (?) ORDER BY damagedItemsInvoice.createdBy, damagedItemsInvoice.idDamagedItemsInvoice ASC",
    [req.body.invoices],
    (err, result) => {
      console.log(err);
      if (result.length > 0) {
        result = result.map(
          (row) => ((row.items = JSON.parse(row.items)), row),
        );
        res.send(result);
      } else {
        res.sendStatus(404);
      }
    },
  );
});

router.get("/contents", function (req, res, next) {
  let query = "";
  let order = "";
  let limit = "";

  if (req.query.date != undefined) {
    query = query + ` AND DATE(createdAt) = '${req.query.date}'`;
  }

  if (
    req.query.dateRangeFrom != undefined &&
    req.query.dateRangeTo != undefined
  ) {
    query =
      query +
      ` AND DATE(createdAt) BETWEEN '${req.query.dateRangeFrom}' AND '${req.query.dateRangeTo}'`;
  }

  if (req.query.item != undefined) {
    query = query + ` AND itemId IN (${req.query.item})`;
  }

  if (req.query.order != undefined) {
    order = "ORDER BY " + req.query.order + " " + req.query.sort;
  }

  if (req.query.limit != undefined) {
    limit = `LIMIT ${req.query.limit}`;
  }
  connection.query(
    `SELECT *, (SELECT @customerId := customerId FROM damagedItemsInvoice WHERE idDamagedItemsInvoice = damagedItemsInvoiceContents.damagedItemsInvoiceId) As customerId,(SELECT storeName FROM customer WHERE idCustomer = @customerId) As customerName, (SELECT  IFNULL(CONCAT(itemType , ' ' , itemName,' ' , itemWeight, ' ' ,itemWeightSuffix, ' ' , ' * ' ,  ' ' , brand.brandName), item.itemName)  FROM item LEFT JOIN itemGroup ON item.itemGroupId = itemGroup.idItemGroup LEFT JOIN brand ON item.brandId = brand.idBrand LEFT JOIN itemType ON itemType.idItemType = item.itemTypeId WHERE idItem = damagedItemsInvoiceContents.itemId) As itemName ,(SELECT imagePath FROM item WHERE idItem = damagedItemsInvoiceContents.itemId) As imagePath , DATE_FORMAT(createdAt, '%Y-%m-%d') As creationFixedDate, DATE_FORMAT(createdAt, '%T') As creationFixedTime, DATE_FORMAT(createdAt, '%W') As creationDayName , (SELECT @createdBy := createdBy FROM damagedItemsInvoice WHERE idDamagedItemsInvoice = damagedItemsInvoiceContents.damagedItemsInvoiceId) As createdBy, (SELECT username FROM user WHERE idUser = @createdBy) As createdByName FROM damagedItemsInvoiceContents WHERE 1=1 ${query} ${order} ${limit}`,
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.post("/new", function (req, res, next) {
  connection.query(
    "INSERT INTO damagedItemsInvoice SET ?",
    [req.body.invoice],
    (err, result) => {
      console.log(err);
      for (let i = 0; i < req.body.invoiceContents.length; i++) {
        req.body.invoiceContents[i].damagedItemsInvoiceId = result.insertId;
        connection.query(
          `INSERT INTO damagedItemsInvoiceContents SET itemId = ?, count = ?, price = (SELECT damagedItemPrice FROM itemPrice WHERE itemPrice.itemId = ? LIMIT 1), totalPrice = (SELECT damagedItemPrice FROM itemPrice WHERE itemPrice.itemId = ? LIMIT 1) * ?, damagedItemsInvoiceId = ?`,
          [
            req.body.invoiceContents[i].itemId,
            req.body.invoiceContents[i].count,
            req.body.invoiceContents[i].itemId,
            req.body.invoiceContents[i].itemId,
            req.body.invoiceContents[i].count * 1,
            req.body.invoiceContents[i].damagedItemsInvoiceId,
          ],
          (err2, result2) => {
            console.log(err2);
          },
        );
      }
      res.send(result);
    },
  );
});

router.post("/addItemToInvoice", function (req, res, next) {
  connection.query(
    "INSERT INTO damagedItemsInvoiceContents SET ?",
    [req.body],
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.put("/edit/:id", function (req, res, next) {
  connection.query(
    `UPDATE damagedItemsInvoice SET ? WHERE idDamagedItemsInvoice = ${req.params["id"]}`,
    [req.body.invoice],
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.delete("/delete/:id", function (req, res, next) {
  connection.query(
    `DELETE FROM damagedItemsInvoice WHERE idDamagedItemsInvoice = ${req.params["id"]}`,
    (err, result) => {
      connection.query(
        `DELETE FROM damagedItemsInvoiceContents WHERE damagedItemsInvoiceId = ${req.params["id"]}`,
        (err2, result2) => {
          console.log(err);
          console.log(err2);
        },
      );
      res.send(result);
    },
  );
});

router.delete("/item/:itemId", function (req, res, next) {
  connection.query(
    "DELETE FROM damagedItemsInvoiceContents WHERE idDamagedItemsInvoiceContents = ?",
    [req.params.itemId],
    (err, result) => {
      res.send(result);
    },
  );
});

module.exports = router;
