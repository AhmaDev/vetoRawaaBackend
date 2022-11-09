var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var db = require("../config/database");
var connection = mysql.createPool(db);
var multer = require("multer");
var path = require("path");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads/customer/"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
  },
});

var upload = multer({ storage: storage });

/* GET customer listing. */
router.get("/", function (req, res, next) {
  connection.query(
    "SELECT *, (CONCAT(storeName , ' ' , idCustomer)) As storeName FROM customer JOIN sellPrice ON customer.sellPriceId = sellPrice.idSellPrice WHERE isManufacture = 0",
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

/* GET customer listing. */
router.get("/searchByName/:type", function (req, res, next) {
  var isManufacture = 0;
  if (req.params.type == "customer") {
    isManufacture = 0;
  } else {
    isManufacture = 1;
  }
  let query = "";
  if (req.query.q != undefined) {
    query = `AND (storeName LIKE '%${req.query.q}%' OR idCustomer = ${req.query.q})`;
  }
  connection.query(
    `SELECT * FROM customer JOIN sellPrice ON customer.sellPriceId = sellPrice.idSellPrice WHERE isManufacture = ${isManufacture} ${query} LIMIT 100`,
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.get("/:id", function (req, res, next) {
  connection.query(
    "SELECT * FROM customer JOIN sellPrice ON customer.sellPriceId = sellPrice.idSellPrice WHERE idCustomer = ? AND isManufacture = 0",
    [req.params.id],
    (err, result) => {
      if (result.length > 0) {
        res.send(result[0]);
      } else {
        res.sendStatus(404);
      }
    },
  );
});

router.get("/info/:id", function (req, res, next) {
  connection.query(
    "SELECT * FROM customerInfo WHERE customerId = ?",
    [req.params.id],
    (err, result) => {
      if (result.length > 0) {
        res.send(result[0]);
      } else {
        res.send({
          idCustomerInfo: null,
          customerId: null,
          employeeName: null,
          employeesCount: null,
          additionalPhoneNumber: null,
          friendPhone: null,
          secondFriendPhone: null,
          standsCount: null,
          customerAge: null,
          customerWork: null,
        });
      }
    },
  );
});

router.get("/images/:id", function (req, res, next) {
  connection.query(
    "SELECT * FROM customerImage WHERE customerId = ?",
    [req.params.id],
    (err, result) => {
      res.send(result);
    },
  );
});

router.get("/user/:id", function (req, res, next) {
  connection.query(
    "SELECT * FROM customer JOIN sellPrice ON customer.sellPriceId = sellPrice.idSellPrice WHERE createdBy = ? AND isManufacture = 0",
    [req.params.id],
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

/**(SELECT COUNT(*) FROM invoice WHERE invoice.createdBy = ? AND invoice.customerId = customer.idCustomer) */
router.get("/userWithInvoicesCount/:id", function (req, res, next) {
  connection.query(
    "SELECT *, 100 As idSellPrice FROM customer JOIN sellPrice ON customer.sellPriceId = sellPrice.idSellPrice WHERE createdBy = ? AND isManufacture = 0",
    [req.params.id, req.params.id],
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.get("/userWithInvoicesCount2/:id", function (req, res, next) {
  connection.query(
    "SELECT *, (SELECT COUNT(*) FROM invoice WHERE invoice.createdBy = ? AND invoice.customerId = customer.idCustomer) As idSellPrice FROM customer JOIN sellPrice ON customer.sellPriceId = sellPrice.idSellPrice WHERE createdBy = ? AND isManufacture = 0",
    [req.params.id, req.params.id],
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.get("/filter/query", function (req, res, next) {
  let query = "";
  let order = "";
  let limit = "";
  let isManufacture = 0;

  if (req.query.id != undefined) {
    query = query + ` AND idCustomer = ${req.query.id}`;
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

  if (req.query.visitDay != undefined) {
    query =
      query +
      ` AND (visitDay = '${req.query.visitDay}' OR secondVisitDay = '${req.query.visitDay}')`;
  }

  if (req.query.order != undefined) {
    order = "ORDER BY " + req.query.order + " " + req.query.sort;
  }

  if (req.query.limit != undefined) {
    limit = `LIMIT ${req.query.limit}`;
  }

  if (req.query.isManufacture != undefined) {
    isManufacture = req.query.isManufacture;
  }
  let totalInvoices = "";
  if (req.query.totalInvoices != undefined && req.query.user != undefined) {
    totalInvoices = `, (SELECT COUNT(*) FROM invoice WHERE invoice.createdBy = ${req.query.user} AND invoice.customerId = customer.idCustomer) As totalInvoices`;
  }

  connection.query(
    `SELECT * ${totalInvoices} FROM customer JOIN sellPrice ON customer.sellPriceId = sellPrice.idSellPrice WHERE isManufacture = ${isManufacture} ${query} ${order} ${limit}`,
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.get("/filterWithLatestInvoice/query", function (req, res, next) {
  let query = "";
  let order = "";
  let limit = "";
  let isManufacture = 0;

  if (req.query.id != undefined) {
    query = query + ` AND idCustomer = ${req.query.id}`;
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

  if (req.query.visitDay != undefined) {
    query =
      query +
      ` AND (visitDay = '${req.query.visitDay}' OR secondVisitDay = '${req.query.visitDay}')`;
  }

  if (req.query.order != undefined) {
    order = "ORDER BY " + req.query.order + " " + req.query.sort;
  }

  if (req.query.limit != undefined) {
    limit = `LIMIT ${req.query.limit}`;
  }

  if (req.query.isManufacture != undefined) {
    isManufacture = req.query.isManufacture;
  }

  connection.query(
    `SELECT * , (SELECT createdAt FROM invoice WHERE customerId = customer.idCustomer ORDER BY idInvoice DESC LIMIT 1) As latestInvoiceDate FROM customer JOIN sellPrice ON customer.sellPriceId = sellPrice.idSellPrice WHERE isManufacture = ${isManufacture} ${query} ${order} ${limit}`,
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.get("/filterWithJoin/query", function (req, res, next) {
  let query = "";
  let order = "";
  let limit = "";
  let isManufacture = 0;

  if (req.query.id != undefined) {
    query = query + ` AND idCustomer = ${req.query.id}`;
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

  if (req.query.visitDay != undefined) {
    query =
      query +
      ` AND (visitDay = '${req.query.visitDay}' OR secondVisitDay = '${req.query.visitDay}')`;
  }

  if (req.query.order != undefined) {
    order = "ORDER BY " + req.query.order + " " + req.query.sort;
  }

  if (req.query.limit != undefined) {
    limit = `LIMIT ${req.query.limit}`;
  }

  if (req.query.isManufacture != undefined) {
    isManufacture = req.query.isManufacture;
  }

  connection.query(
    `SELECT * FROM customer JOIN sellPrice ON customer.sellPriceId = sellPrice.idSellPrice JOIN user ON customer.createdBy = user.idUser WHERE isManufacture = ${isManufacture} ${query} ${order} ${limit}`,
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.get("/search/:userId", function (req, res, next) {
  connection.query(
    `SELECT * FROM customer JOIN sellPrice ON customer.sellPriceId = sellPrice.idSellPrice WHERE storeName LIKE '%${req.query.name}%' AND createdBy = ${req.params.userId} AND isManufacture = 0 LIMIT 15`,
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.post("/new", upload.array("files", 4), function (req, res, next) {
  connection.query(
    "INSERT INTO customer SET ?",
    [req.body.customer],
    (err, result) => {
      if (!err) {
        connection.query(
          `INSERT INTO customerInfo SET ?`,
          { customerId: result.insertId, ...req.body.customerInfo },
          (errCustomerInfo, resultCustomerInfo) => {
            if (!errCustomerInfo) {
              if (req.files.length > 0) {
                var files = req.files.map((e) => [
                  result.insertId,
                  "uploads/customer/" + e.filename,
                ]);
                connection.query(
                  `INSERT INTO customerImage (customerId, imagePath) VALUES ?`,
                  [files],
                  (errUploadImages, resultUploadImages) => {
                    if (errUploadImages) {
                      console.log("Error while adding a file", errUploadImages);
                      res.sendStatus(500);
                      return;
                    }
                    res.send("OK");
                  },
                );
              } else {
                res.send("OK");
              }
            } else {
              console.log(errCustomerInfo);
              res.sendStatus(500);
            }
          },
        );
      } else {
        console.log(err);
        res.sendStatus(500);
      }
    },
  );
});

router.put("/edit/:id", function (req, res, next) {
  connection.query(
    `UPDATE customer SET ? WHERE idCustomer = ${req.params["id"]}`,
    [req.body],
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.put("/info/:id", function (req, res, next) {
  connection.query(
    `UPDATE customerInfo SET ? WHERE customerId = ${req.params["id"]}`,
    [req.body],
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.put("/edit/multiple/:id", function (req, res, next) {
  connection.query(
    `UPDATE customer SET ? WHERE idCustomer in (${req.params["id"]})`,
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
    `UPDATE customer SET isManufacture = 2 WHERE idCustomer IN (${req.params["id"]})`,
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
