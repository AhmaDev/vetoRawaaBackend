var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var db = require("../config/database");
var connection = mysql.createConnection(db);

/* GET sellPrice listing. */
router.get("/", function (req, res, next) {
  connection.query(
    "SELECT *,DATE_FORMAT(createdAt, '%Y-%m-%d') As creationFixedDate, DATE_FORMAT(createdAt, '%W') As creationDayName, (SELECT username FROM user WHERE idUser = deliveryStatus.deliveryId) As deliveryName FROM deliveryStatus ORDER BY createdAt DESC",
    (err, result) => {
      result.forEach((e) => (e.invoicesData = JSON.parse(e.invoicesData)));
      result.forEach((e) => (e.delegates = JSON.parse(e.delegates)));
      result.forEach((e) => (e.invoices = JSON.parse(e.invoices)));
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.get("/counter", function (req, res, next) {
  connection.query(
    "SELECT MAX(counter) As counter FROM deliveryStatus",
    (err, result) => {
      res.send(result[0]);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.get("/damagedStatus", function (req, res, next) {
  connection.query(
    "SELECT *,DATE_FORMAT(createdAt, '%Y-%m-%d') As creationFixedDate, DATE_FORMAT(createdAt, '%W') As creationDayName, (SELECT username FROM user WHERE idUser = damagedStatus.deliveryId) As deliveryName FROM damagedStatus ORDER BY createdAt DESC",
    (err, result) => {
      result.forEach((e) => (e.invoicesData = JSON.parse(e.invoicesData)));
      result.forEach((e) => (e.delegates = JSON.parse(e.delegates)));
      result.forEach((e) => (e.invoices = JSON.parse(e.invoices)));
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.get("/multipleInvoices", function (req, res, next) {
  connection.query(
    `SELECT invoiceContent.itemId, SUM(count) As count, SUM(total) As total, invoiceContent.discountTypeId, invoice.createdBy, invoice.sellPriceId, invoice.invoiceTypeId , (SELECT itemName FROM item WHERE idItem = invoiceContent.itemId) As itemName FROM invoiceContent JOIN invoice ON invoiceContent.invoiceId = invoice.idInvoice WHERE invoice.invoiceTypeId = 1 AND invoice.createdBy IN (${req.query.delegates}) AND DATE(invoice.createdAt) = '${req.query.date}' AND invoiceContent.count != 0 GROUP BY invoiceContent.itemId, invoiceContent.discountTypeId ORDER BY invoiceContent.itemId , invoiceContent.discountTypeId`,
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.post("/", function (req, res, next) {
  connection.query(
    "INSERT INTO deliveryStatus SET ?",
    req.body,
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.post("/multipleInsert", function (req, res, next) {
  if (req.body.deliveryStatusType == 1) {
    var deliveryIds = JSON.stringify(req.body.deliveries).slice(1, -1);
    console.log("deliveryIds", deliveryIds);

    connection.query(
      `SELECT * FROM deliveryDelegates WHERE deliveryId IN (${deliveryIds})`,
      (deliveriesErr, deliveriesResult) => {
        console.log(deliveriesErr);
        var delegatesIds = JSON.stringify(
          deliveriesResult.map((e) => e.delegateId),
        ).slice(1, -1);
        console.log("DELEGATES", delegatesIds);
        connection.query(
          `SELECT invoiceContent.itemId, SUM(count) As count, SUM(total) As total, invoiceContent.discountTypeId, invoice.createdBy, invoice.sellPriceId, invoice.invoiceTypeId , (SELECT itemName FROM item WHERE idItem = invoiceContent.itemId) As itemName FROM invoiceContent JOIN invoice ON invoiceContent.invoiceId = invoice.idInvoice WHERE invoice.invoiceTypeId = 1 AND invoice.createdBy IN (${delegatesIds}) AND DATE(invoice.createdAt) = '${req.body.date}' AND invoiceContent.count != 0 GROUP BY invoiceContent.itemId, invoiceContent.discountTypeId ORDER BY invoiceContent.itemId , invoiceContent.discountTypeId`,
          (err, result) => {
            console.log(err);
            connection.query(
              `SELECT * FROM invoice WHERE invoiceTypeId = 1 AND createdBy IN (${delegatesIds}) AND DATE(invoice.createdAt) = '${req.body.date}'`,
              (errInvoices, resultInvoices) => {
                console.log(errInvoices);
                if (result.length > 0) {
                  connection.query(
                    `SELECT counter As totalCount FROM deliveryStatus WHERE deliveryStatusType = ${req.body.deliveryStatusType} ORDER BY counter DESC LIMIT 1`,
                    (errCount, resultCount) => {
                      if (!errCount) {
                        connection.query(
                          "INSERT INTO deliveryStatus SET ?",
                          {
                            deliveryId: req.body.deliveries[0],
                            delegates: JSON.stringify(
                              deliveriesResult.map((e) => e.delegateId),
                            ),
                            invoicesData: JSON.stringify(result),
                            createdAt: req.body.date,
                            invoices: JSON.stringify(
                              resultInvoices.map((e) => e.idInvoice),
                            ),
                            notice: "none",
                            deliveryStatusType: req.body.deliveryStatusType,
                            counter: resultCount[0].totalCount + 1,
                          },
                          (err3, result3) => {
                            console.log(err3, result3);
                          },
                        );
                      }
                    },
                  );
                }
              },
            );
          },
        );
      },
    );
    res.sendStatus(200);
  } else {
    for (let i = 0; i < req.body.deliveries.length; i++) {
      connection.query(
        `SELECT * FROM deliveryDelegates WHERE deliveryId = ${req.body.deliveries[i]}`,
        (deliveriesErr, deliveriesResult) => {
          console.log(deliveriesErr);
          var delegatesIds = JSON.stringify(
            deliveriesResult.map((e) => e.delegateId),
          ).slice(1, -1);
          connection.query(
            `SELECT invoiceContent.itemId, SUM(count) As count, SUM(total) As total, invoiceContent.discountTypeId, invoice.createdBy, invoice.sellPriceId, invoice.invoiceTypeId , (SELECT itemName FROM item WHERE idItem = invoiceContent.itemId) As itemName FROM invoiceContent JOIN invoice ON invoiceContent.invoiceId = invoice.idInvoice WHERE invoice.invoiceTypeId = 1 AND invoice.createdBy IN (${delegatesIds}) AND DATE(invoice.createdAt) = '${req.body.date}' AND invoiceContent.count != 0 GROUP BY invoiceContent.itemId, invoiceContent.discountTypeId ORDER BY invoiceContent.itemId , invoiceContent.discountTypeId`,
            (err, result) => {
              console.log(err);
              connection.query(
                `SELECT * FROM invoice WHERE invoiceTypeId = 1 AND createdBy IN (${delegatesIds}) AND DATE(invoice.createdAt) = '${req.body.date}'`,
                (errInvoices, resultInvoices) => {
                  if (result.length > 0) {
                    connection.query(
                      `SELECT counter As totalCount FROM deliveryStatus WHERE deliveryStatusType = ${req.body.deliveryStatusType} ORDER BY counter DESC LIMIT 1`,
                      (errCount, resultCount) => {
                        if (!errCount) {
                          connection.query(
                            "INSERT INTO deliveryStatus SET ?",
                            {
                              deliveryId: req.body.deliveries[i],
                              delegates: JSON.stringify(
                                deliveriesResult.map((e) => e.delegateId),
                              ),
                              invoicesData: JSON.stringify(result),
                              createdAt: req.body.date,
                              invoices: JSON.stringify(
                                resultInvoices.map((e) => e.idInvoice),
                              ),
                              notice: "none",
                              deliveryStatusType: req.body.deliveryStatusType,
                              counter: resultCount[0].totalCount + i + 1,
                            },
                            (err3, result3) => {
                              console.log(err3, result3);
                            },
                          );
                        } else {
                          console.log(errCount);
                        }
                      },
                    );
                  }
                },
              );
            },
          );
        },
      );
    }
    res.sendStatus(200);
  }
});

router.post("/damagedMultipleInsert", function (req, res, next) {
  if (req.body.deliveryStatusType == 3) {
    var deliveryIds = JSON.stringify(req.body.deliveries).slice(1, -1);
    console.log("deliveryIds", deliveryIds);
    connection.query(
      `SELECT * FROM deliveryDelegates WHERE deliveryId IN (${deliveryIds})`,
      (deliveriesErr, deliveriesResult) => {
        console.log(deliveriesErr);
        var delegatesIds = JSON.stringify(
          deliveriesResult.map((e) => e.delegateId),
        ).slice(1, -1);
        connection.query(
          `SELECT damagedItemsInvoiceContents.itemId, SUM(count) As count, SUM(totalPrice) As total, damagedItemsInvoice.createdBy , (SELECT itemName FROM item WHERE idItem = damagedItemsInvoiceContents.itemId) As itemName FROM damagedItemsInvoiceContents JOIN damagedItemsInvoice ON damagedItemsInvoiceContents.damagedItemsInvoiceId = damagedItemsInvoice.idDamagedItemsInvoice WHERE damagedItemsInvoice.createdBy IN (${delegatesIds}) AND DATE(damagedItemsInvoice.createdAt) = '${req.body.date}' AND damagedItemsInvoiceContents.count != 0 GROUP BY damagedItemsInvoiceContents.itemId ORDER BY damagedItemsInvoiceContents.itemId`,
          (err, result) => {
            console.log(err);
            connection.query(
              `SELECT * FROM damagedItemsInvoice WHERE createdBy IN (${delegatesIds}) AND DATE(damagedItemsInvoice.createdAt) = '${req.body.date}'`,
              (errInvoices, resultInvoices) => {
                console.log(errInvoices);
                if (result.length > 0) {
                  connection.query(
                    `SELECT counter As totalCount FROM damagedStatus WHERE deliveryStatusType = ${req.body.deliveryStatusType} ORDER BY counter DESC LIMIT 1`,
                    (errCount, resultCount) => {
                      if (!errCount) {
                        connection.query(
                          "INSERT INTO damagedStatus SET ?",
                          {
                            deliveryId: req.body.deliveries[0],
                            delegates: JSON.stringify(
                              deliveriesResult.map((e) => e.delegateId),
                            ),
                            invoicesData: JSON.stringify(result),
                            createdAt: req.body.date,
                            invoices: JSON.stringify(
                              resultInvoices.map(
                                (e) => e.idDamagedItemsInvoice,
                              ),
                            ),
                            notice: "none",
                            deliveryStatusType: req.body.deliveryStatusType,
                            counter: resultCount[0].totalCount + 1,
                          },
                          (err3, result3) => {
                            console.log(err3, result3);
                          },
                        );
                      } else {
                        console.log(errCount);
                      }
                    },
                  );
                }
              },
            );
          },
        );
      },
    );

    res.sendStatus(200);
  } else {
    for (let i = 0; i < req.body.deliveries.length; i++) {
      connection.query(
        `SELECT * FROM deliveryDelegates WHERE deliveryId = ${req.body.deliveries[i]}`,
        (deliveriesErr, deliveriesResult) => {
          console.log(deliveriesErr);
          var delegatesIds = JSON.stringify(
            deliveriesResult.map((e) => e.delegateId),
          ).slice(1, -1);
          console.log("DEL_IDS:", delegatesIds);
          connection.query(
            `SELECT damagedItemsInvoiceContents.itemId, SUM(count) As count, SUM(totalPrice) As total, damagedItemsInvoice.createdBy , (SELECT itemName FROM item WHERE idItem = damagedItemsInvoiceContents.itemId) As itemName FROM damagedItemsInvoiceContents JOIN damagedItemsInvoice ON damagedItemsInvoiceContents.damagedItemsInvoiceId = damagedItemsInvoice.idDamagedItemsInvoice WHERE damagedItemsInvoice.createdBy IN (${delegatesIds}) AND DATE(damagedItemsInvoice.createdAt) = '${req.body.date}' AND damagedItemsInvoiceContents.count != 0 GROUP BY damagedItemsInvoiceContents.itemId ORDER BY damagedItemsInvoiceContents.itemId`,
            (err, result) => {
              console.log(err);
              connection.query(
                `SELECT * FROM damagedItemsInvoice WHERE createdBy IN (${delegatesIds}) AND DATE(damagedItemsInvoice.createdAt) = '${req.body.date}'`,
                (errInvoices, resultInvoices) => {
                  if (result.length > 0) {
                    connection.query(
                      `SELECT counter As totalCount FROM damagedStatus WHERE deliveryStatusType = ${req.body.deliveryStatusType} ORDER BY counter DESC LIMIT 1`,
                      (errCount, resultCount) => {
                        if (!errCount) {
                          connection.query(
                            "INSERT INTO damagedStatus SET ?",
                            {
                              deliveryId: req.body.deliveries[i],
                              delegates: JSON.stringify(
                                deliveriesResult.map((e) => e.delegateId),
                              ),
                              invoicesData: JSON.stringify(result),
                              createdAt: req.body.date,
                              invoices: JSON.stringify(
                                resultInvoices.map(
                                  (e) => e.idDamagedItemsInvoice,
                                ),
                              ),
                              notice: "none",
                              deliveryStatusType: req.body.deliveryStatusType,
                              counter: resultCount[0].totalCount + i + 1,
                            },
                            (err3, result3) => {
                              console.log(err3, result3);
                            },
                          );
                        } else {
                          console.log(errCount);
                        }
                      },
                    );
                  }
                },
              );
            },
          );
        },
      );
    }
    res.sendStatus(200);
  }
});

router.post("/multipleInvoices/:delegateId", function (req, res, next) {
  var delegatesIds = parseInt(req.params.delegateId);
  connection.query(
    `SELECT invoiceContent.itemId, SUM(count) As count, SUM(total) As total, invoiceContent.discountTypeId, invoice.createdBy, invoice.sellPriceId, invoice.invoiceTypeId , (SELECT itemName FROM item WHERE idItem = invoiceContent.itemId) As itemName FROM invoiceContent JOIN invoice ON invoiceContent.invoiceId = invoice.idInvoice WHERE invoice.invoiceTypeId = 1 AND invoice.createdBy IN (${delegatesIds}) AND DATE(invoice.createdAt) = '${req.body.date}' AND invoiceContent.count != 0 GROUP BY invoiceContent.itemId, invoiceContent.discountTypeId ORDER BY invoiceContent.itemId , invoiceContent.discountTypeId`,
    (err, result) => {
      console.log(err);
      connection.query(
        `SELECT * FROM invoice WHERE invoiceTypeId = 1 AND createdBy IN (${delegatesIds}) AND DATE(invoice.createdAt) = '${req.body.date}'`,
        (errInvoices, resultInvoices) => {
          console.log(errInvoices);
          if (result.length > 0) {
            connection.query(
              `SELECT counter As totalCount FROM deliveryStatus WHERE deliveryStatusType = ${req.body.deliveryStatusType} ORDER BY counter DESC LIMIT 1`,
              (errCount, resultCount) => {
                console.log(errCount);
                if (!errCount) {
                  connection.query(
                    "INSERT INTO deliveryStatus SET ?",
                    {
                      deliveryId: req.body.delivery,
                      delegates: JSON.stringify([delegatesIds]),
                      invoicesData: JSON.stringify(result),
                      createdAt: req.body.date,
                      invoices: JSON.stringify(
                        resultInvoices.map((e) => e.idInvoice),
                      ),
                      notice: "delegateInvoices",
                      deliveryStatusType: req.body.deliveryStatusType,
                      counter: resultCount[0].totalCount + 1,
                    },
                    (err3, result3) => {
                      console.log(err3, result3);
                      res.sendStatus(200);
                    },
                  );
                }
              },
            );
          }
        },
      );
    },
  );
});
router.get("/:id", function (req, res, next) {
  connection.query(
    "SELECT *,DATE_FORMAT(createdAt, '%Y-%m-%d') As creationFixedDate, DATE_FORMAT(createdAt, '%W') As creationDayName,  (SELECT username FROM user WHERE idUser = deliveryStatus.deliveryId) As deliveryName FROM deliveryStatus WHERE idDeliveryStatus = ?",
    [req.params.id],
    (err, result) => {
      if (result.length > 0) {
        result.forEach((e) => (e.invoicesData = JSON.parse(e.invoicesData)));
        result.forEach((e) => (e.delegates = JSON.parse(e.delegates)));
        result.forEach((e) => (e.invoices = JSON.parse(e.invoices)));
        res.send(result[0]);
      } else {
        res.sendStatus(404);
      }
    },
  );
});

router.get("/damagedStatus/:id", function (req, res, next) {
  connection.query(
    "SELECT *,DATE_FORMAT(createdAt, '%Y-%m-%d') As creationFixedDate, DATE_FORMAT(createdAt, '%W') As creationDayName,  (SELECT username FROM user WHERE idUser = damagedStatus.deliveryId) As deliveryName FROM damagedStatus WHERE idDeliveryStatus = ?",
    [req.params.id],
    (err, result) => {
      if (result.length > 0) {
        result.forEach((e) => (e.invoicesData = JSON.parse(e.invoicesData)));
        result.forEach((e) => (e.delegates = JSON.parse(e.delegates)));
        result.forEach((e) => (e.invoices = JSON.parse(e.invoices)));
        res.send(result[0]);
      } else {
        res.sendStatus(404);
      }
    },
  );
});

router.put("/:id", function (req, res, next) {
  connection.query(
    "UPDATE deliveryStatus SET ? WHERE idDeliveryStatus = ?",
    [req.params.id],
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.delete("/:id", function (req, res, next) {
  connection.query(
    `DELETE FROM deliveryStatus WHERE idDeliveryStatus = ${req.params.id}`,
    req.body,
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

module.exports = router;
