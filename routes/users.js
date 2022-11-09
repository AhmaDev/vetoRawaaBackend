var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var db = require("../config/database");
var multer = require("multer");
var connection = mysql.createConnection(db);
var path = require("path");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads/"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
  },
});

var upload = multer({ storage: storage });

/* GET users listing. */
router.get("/", function (req, res, next) {
  connection.query(
    "SELECT *, '********' As password FROM user JOIN role ON user.roleId = role.idRole",
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.get("/unsecure/all", function (req, res, next) {
  connection.query(
    "SELECT * FROM user JOIN role ON user.roleId = role.idRole",
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
    "SELECT *, '********' As password FROM user JOIN role ON user.roleId = role.idRole WHERE idUser = ?",
    [req.params["id"]],
    (err, result) => {
      if (result.length > 0) {
        connection.query(
          `SELECT (SELECT permissionKey FROM permission WHERE idPermission = rolePermissions.permissionId) As permissionKey FROM rolePermissions WHERE roleId = ${result[0].roleId}`,
          (permErr, permRslt) => {
            result[0].permissions = permRslt;
            res.send(result[0]);
            console.log(permErr);
          },
        );
      } else {
        res.sendStatus(404);
      }
      if (err) {
        console.log(err);
      }
    },
  );
});

router.get("/allData/:id", function (req, res, next) {
  connection.query(
    "SELECT *, '********' As password  FROM user LEFT JOIN role ON user.roleId = role.idRole JOIN userInfo ON user.idUser = userInfo.userId WHERE user.idUser = ?",
    [req.params.id],
    (err, result) => {
      if (result.length > 0) {
        connection.query(
          `SELECT (SELECT permissionKey FROM permission WHERE idPermission = rolePermissions.permissionId) As permissionKey FROM rolePermissions WHERE roleId = ${result[0].roleId}`,
          (permErr, permRslt) => {
            result[0].permissions = permRslt;
            res.send(result[0]);
            console.log(permErr);
          },
        );
      } else {
        res.sendStatus(404);
      }
      if (err) {
        console.log(err);
      }
    },
  );
});

/* GET users by roleId. */
router.get("/role/:id", function (req, res, next) {
  connection.query(
    "SELECT *, '********' As password  FROM user JOIN role ON user.roleId = role.idRole WHERE roleId = ?",
    [req.params["id"]],
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.get("/roles/all", function (req, res, next) {
  connection.query("SELECT * FROM role", (err, result) => {
    res.send(result);
    if (err) {
      console.log(err);
    }
  });
});

router.get("/userinfo/:id", function (req, res, next) {
  connection.query(
    "SELECT * FROM userInfo WHERE userId = ?",
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

router.post("/new/userinfo", function (req, res, next) {
  connection.query("INSERT INTO userInfo SET ?", req.body, (err, result) => {
    res.send(result);
    if (err) {
      console.log(err);
    }
  });
});

router.put("/edit/userinfo/:id", function (req, res, next) {
  connection.query(
    `UPDATE userInfo SET ? WHERE userId = ${req.params.id}`,
    req.body,
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

router.put(
  "/updateImage/:id",
  upload.single("userImage"),
  function (req, res, next) {
    let imagePath = null;
    if (req.file != undefined && req.file.fieldname == "userImage") {
      imagePath = "uploads/" + req.file.filename;
    }
    connection.query(
      `UPDATE userInfo SET imagePath = ? WHERE userId = ${req.params["id"]}`,
      [imagePath],
      (err, result) => {
        res.send(result);
        if (err) {
          console.log(err);
        }
      },
    );
  },
);

router.get("/count/total", function (req, res, next) {
  connection.query("SELECT * FROM item", (err, result) => {
    res.send({ count: result.length });
    if (err) {
      console.log(err);
    }
  });
});

router.post("/logout/:id", function (req, res, next) {
  connection.query(
    "UPDATE user SET email = '0' WHERE idUser = ?",
    [req.params.id],
    (err, result) => {
      res.sendStatus(200);
      if (err) {
        console.log(err);
      }
    },
  );
});

/* LOGIN */
router.post("/login", function (req, res, next) {
  connection.query(
    "SELECT *, '********' As password  FROM user LEFT JOIN role ON user.roleId = role.idRole JOIN userInfo ON user.idUser = userInfo.userId WHERE user.username = ? AND user.password = ?",
    [req.body.username, req.body.password],
    (err, result) => {
      if (result.length > 0) {
        if (
          (result[0].roleId == 4 || result[0].roleId == 3) &&
          result[0].email == "1"
        ) {
          res.sendStatus(409);
          return;
        } else {
          connection.query(
            `UPDATE user SET email = '1' WHERE idUser = ${result[0].idUser}`,
            (errUpdateStatus, resultUpdateStatus) => {
              connection.query(
                `SELECT (SELECT permissionKey FROM permission WHERE idPermission = rolePermissions.permissionId) As permissionKey FROM rolePermissions WHERE roleId = ${result[0].roleId}`,
                (permErr, permRslt) => {
                  result[0].permissions = permRslt;
                  res.send(result[0]);
                  console.log(permErr);
                },
              );
            },
          );
        }
      } else {
        res.sendStatus(404);
      }
      if (err) {
        console.log(err);
      }
    },
  );
});

/* ADD USER */
router.post("/new", function (req, res, next) {
  console.log(req.body);
  connection.query(`INSERT INTO user SET ?`, req.body, (err, result) => {
    res.send(result);
    if (err) {
      console.log(err);
    }
  });
});

/* EDIT USER */
router.put("/edit/:id", function (req, res, next) {
  console.log(req.body);
  connection.query(
    `UPDATE user SET ? WHERE idUser = ${req.params["id"]}`,
    [req.body],
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

/* EDIT USER */
router.delete("/:id", function (req, res, next) {
  console.log(req.body);
  connection.query(
    `DELETE FROM user WHERE idUser = ${req.params["id"]}`,
    (err, result) => {
      res.send(result);
      if (err) {
        console.log(err);
      }
    },
  );
});

module.exports = router;
