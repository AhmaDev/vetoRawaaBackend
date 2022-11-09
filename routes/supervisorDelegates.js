var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var db = require("../config/database");
var connection = mysql.createPool(db);

/* GET discount listing. */
router.get("/", function (req, res, next) {
  connection.query("SELECT * FROM supervisorDelegates", (err, result) => {
    res.send(result);
    if (err) {
      console.log(err);
    }
  });
});

router.get("/userid/:id", function (req, res, next) {
  const weekday = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
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
  var dayname = weekday[new Date(date).getDay()].toLowerCase();
  connection.query(
    `SELECT *, (SELECT user.username FROM user WHERE user.idUser = supervisorDelegates.delegateId) AS delegateName, (SELECT @totalInvoices := IFNULL(COUNT(invoice.idInvoice), 0) FROM invoice WHERE invoice.invoiceTypeId = 1 AND invoice.createdBy = supervisorDelegates.delegateId AND invoice.createdAt BETWEEN '${date} 00:00:00' AND '${date} 23:59:59') AS totalInvoicesToday, (SELECT @totalInvoices := IFNULL(COUNT(invoice.idInvoice), 0) FROM invoice JOIN customer ON customer.idCustomer = invoice.customerId WHERE invoice.invoiceTypeId = 1 AND invoice.createdBy = supervisorDelegates.delegateId AND invoice.createdAt BETWEEN '${date} 00:00:00' AND '${date} 23:59:59' AND customer.visitDay != '${dayname}') AS totalInvoicesTodayNotInRail, (SELECT @totalVisits := IFNULL(COUNT(visit.idVisit), 0) FROM visit WHERE visit.createdBy = supervisorDelegates.delegateId AND visit.createdAt BETWEEN '${date} 00:00:00' AND '${date} 23:59:59') AS totalVisitsToday, (SELECT @totalVisits := IFNULL(COUNT(visit.idVisit), 0) FROM visit JOIN customer ON visit.customerId = customer.idCustomer WHERE visit.createdBy = supervisorDelegates.delegateId AND visit.createdAt BETWEEN '${date} 00:00:00' AND '${date} 23:59:59' AND customer.visitDay != '${dayname}') AS totalVisitsTodayNotInRail, (SELECT @totalCustomerToCheck := IFNULL(COUNT(customer.idCustomer), 0) FROM customer WHERE customer.createdBy = supervisorDelegates.delegateId AND ( customer.visitDay = LOWER(DAYNAME('${date}')) OR customer.secondVisitDay = LOWER(DAYNAME('${date}')) )) AS totalCustomersToCheck, (@totalCustomerToCheck - @totalInvoices - @totalVisits) AS ramainingCustomers, (SELECT @totalBills := IFNULL(sum(invoiceContent.total), 0) FROM invoiceContent JOIN invoice ON invoiceContent.invoiceId = invoice.idInvoice WHERE invoice.createdBy = supervisorDelegates.delegateId AND invoice.invoiceTypeId = 1 AND invoice.createdAt BETWEEN '${date} 00:00:00' AND '${date} 23:59:59') AS totalBills, (SELECT @totalRestoreBills := IFNULL(sum(invoiceContent.total), 0) FROM invoiceContent JOIN invoice ON invoiceContent.invoiceId = invoice.idInvoice WHERE invoice.createdBy = supervisorDelegates.delegateId AND invoice.invoiceTypeId = 3 AND invoice.createdAt BETWEEN '${date} 00:00:00' AND '${date} 23:59:59') AS totalRestoreBills, (SELECT @totalDamaged := IFNULL(SUM(damagedItemsInvoiceContents.totalPrice), 0) FROM damagedItemsInvoiceContents JOIN damagedItemsInvoice ON damagedItemsInvoiceContents.damagedItemsInvoiceId = damagedItemsInvoice.idDamagedItemsInvoice WHERE damagedItemsInvoice.createdBy = supervisorDelegates.delegateId AND damagedItemsInvoice.createdAt BETWEEN '${date} 00:00:00' AND '${date} 23:59:59') AS totalDamaged FROM supervisorDelegates WHERE supervisorDelegates.supervisorId = ? ORDER BY @totalBills ASC`,
    [req.params.id],
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.get("/delegate/:id", function (req, res, next) {
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
    `SELECT * FROM (SELECT createdAt, 'invoice' As type , idInvoice As id, createdBy, customerId, (SELECT storeName FROM customer WHERE idCustomer = invoice.customerId) As customerName, (SELECT visitDay FROM customer WHERE idCustomer = invoice.customerId) As visitDay, (SELECT IFNULL(SUM(total),0) FROM invoiceContent WHERE invoiceId = invoice.idInvoice) AS total , DATE_FORMAT(createdAt, '%Y-%m-%d') As creationFixedDate, DATE_FORMAT(createdAt, '%r') As creationFixedTime, DATE_FORMAT(createdAt, '%W') As creationDayName FROM invoice WHERE invoice.createdBy = ${req.params.id} AND DATE(invoice.createdAt) = '${req.query.date}' AND invoice.invoiceTypeId = 1 UNION ALL SELECT createdAt, 'visit' As type, idVisit As id, createdBy, customerId,(SELECT storeName FROM customer WHERE idCustomer = visit.customerId) As customerName,(SELECT visitDay FROM customer WHERE idCustomer = visit.customerId) As visitDay, (SELECT visitCauseName FROM visitCause WHERE idVisitCause = visit.visitCauseId) As total, DATE_FORMAT(createdAt, '%Y-%m-%d') As creationFixedDate, DATE_FORMAT(createdAt, '%r') As creationFixedTime, DATE_FORMAT(createdAt, '%W') As creationDayName FROM visit WHERE visit.createdBy = ${req.params.id} AND DATE(visit.createdAt) = '${req.query.date}') a ORDER BY createdAt`,
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
    "INSERT INTO supervisorDelegates SET ?",
    [req.body],
    (err, result) => {
      if (err) {
        console.log(err);
        res.sendStatus(409);
      } else {
        res.send(result);
      }
    },
  );
});

router.post("/multiple/:supervisorId", function (req, res, next) {
  connection.query(
    `DELETE FROM supervisorDelegates WHERE superVisorId = ${req.params.supervisorId}`,
    (deleteErr, deleteResult) => {
      if (deleteErr) {
        res.sendStatus(500);
        return;
      }
      connection.query(
        "INSERT INTO supervisorDelegates (supervisorId, delegateId) VALUES ?",
        [req.body],
        (err, result) => {
          if (err) {
            console.log(err);
            res.sendStatus(409);
          } else {
            res.send(result);
          }
        },
      );
    },
  );
});

router.put("/edit/:id", function (req, res, next) {
  connection.query(
    `UPDATE supervisorDelegates SET ? WHERE idSupervisorDelegates = ${req.params["id"]}`,
    [req.body],
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
    `DELETE FROM supervisorDelegates WHERE idSupervisorDelegates = ${req.params["id"]}`,
    [req.body],
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

module.exports = router;
