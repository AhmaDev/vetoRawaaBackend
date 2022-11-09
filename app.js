var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var http = require("http");
var socketio = require("socket.io");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var selltypeRouter = require('./routes/selltype');
var sellpriceRouter = require('./routes/sellprice');
var discountRouter = require('./routes/discount');
var customerRouter = require('./routes/customer');
var customerClassRouter = require('./routes/customerClass');
var itemRouter = require('./routes/item');
var itemgroupRouter = require('./routes/itemgroup');
var invoiceRouter = require('./routes/invoice');
var filesRouter = require('./routes/files');
var permissionRouter = require('./routes/permission');
var settingsRouter = require('./routes/settings');
var visitCausesRouter = require('./routes/visitCause');
var visitRouter = require('./routes/visit');
var supervisorDelegates = require('./routes/supervisorDelegates');
var deliveryDelegates = require('./routes/deliveryDelegates');
var provinces = require('./routes/provinces');
var damagedInvoice = require('./routes/damagedItemsInvoice');
var itemType = require('./routes/itemType');
var manufacture = require('./routes/manufacture');
var reports = require('./routes/reports');
var deliveryStatus = require('./routes/deliveryStatus');
var dashboard = require('./routes/dashboard');
var brand = require('./routes/brand');


var app = express();

var server = http.createServer(app);
const io = require('socket.io')(server, {
  allowEIO3: true,
  cors: {
    origins: ['*'],
    credentials: true,
  }
});

io.on('connection', function (socket) {
  var user = JSON.parse(socket.handshake.query.userInfo);
  console.log(`${user.username} is connected: ${socket.id}`);
  socket.join(`USER_${user.idUser}`);
  socket.on('logout', (data) => {
    io.to(`USER_${data.userId}`).emit("logoutEmit", "HI");
  })
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use(function (req, res, next) {
  req.io = io;
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/selltype', selltypeRouter);
app.use('/sellprice', sellpriceRouter);
app.use('/discount', discountRouter);
app.use('/customer', customerRouter);
app.use('/customerClass', customerClassRouter);
app.use('/item', itemRouter);
app.use('/itemgroup', itemgroupRouter);
app.use('/invoice', invoiceRouter);
app.use('/files', filesRouter);
app.use('/permissions', permissionRouter);
app.use('/settings', settingsRouter);
app.use('/visitCauses', visitCausesRouter);
app.use('/visit', visitRouter);
app.use('/supervisorDelegates', supervisorDelegates);
app.use('/deliveryDelegates', deliveryDelegates);
app.use('/provinces', provinces);
app.use('/damagedInvoice', damagedInvoice);
app.use('/itemType', itemType);
app.use('/manufacture', manufacture);
app.use('/reports', reports);
app.use('/deliveryStatus', deliveryStatus);
app.use('/dashboard', dashboard);
app.use('/brands', brand);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = { app: app, server: server };
