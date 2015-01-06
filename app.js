/**
 * Module dependencies.
 */

var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var methodOverride = require('method-override');
var _ = require('lodash');
var MongoStore = require('connect-mongo')({ session: session });
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');
var User = require('./models/User');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');


/**
 * Controllers (route handlers).
 */

var userController = require('./controllers/user');
var apiController = require('./controllers/api');

/**
 * API keys and Passport configuration.
 */

var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

/**
 * Create Express server.
 */

var app = express();
app.set('env', process.env.ENV || 'development');


/**
 * Connect to MongoDB.
 */

mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Make sure MongoDB is running.');
});

var hour = 3600000;
var day = hour * 24;
var week = day * 7;

/**
 * CSRF whitelist.
 */

var csrfExclude = ['/url1', '/url2'];

/**
 * Express configuration.
 */

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));


app.set('view engine', 'jade');
app.use(compress());
app.use(connectAssets({
  paths: [path.join(__dirname, 'public/css'), path.join(__dirname, 'public/js')],
  helperContext: app.locals
}));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());


app.use('/api', userController.validateToken);

app.use(express.static(path.join(__dirname, 'public'), { maxAge: week }));

(function seed () {

    User.findOne({email: 'admin@twerk.io'},
        function (err, existingUser) {
            if (err) console.log(err);

            if (existingUser == null) {
                var user = new User({
                    email: 'admin@twerk.io',
                    password: secrets.admin_pw,
                    roles: ['User', 'Blogger', 'Admin'],
                    verified: true
                });

                user.save(function (err) {
                    if (err) console.log(err);
                    console.log("Mongo connection success. Seed data success.");
                })


            } else {
                console.log("Mongo connection success. No seed data necessary.");
            }
        });
}) ();

/**
 * Main routes.
 */

app.get('/partials/outer/:name', function(req, res) {
    res.render('partials/outerState/' + req.params.name);
});

app.get('/partials/inner/:dir/:name', function(req, res) {
    res.render('partials/innerState/' + req.params.dir + '/' + req.params.name);
});


app.post('/authenticate', apiController.authenticate);
app.post('/register', apiController.register);
app.get('/verify/{:email}', apiController.verifyUserEmail);

app.get('/api/user', apiController.getUser);
app.get('/api/userprofile', apiController.getUserProfile);
app.post('/api/userprofile', apiController.postUserProfile);
app.post('/api/userpicture', apiController.postUserPicture);

app.get('/api/browse', apiController.getBrowse);
app.get('/api/browse/:id', apiController.getBrowse);

app.get('/api/admin/allusers', apiController.adminAllUsers);
app.post('/api/admin/saveuser', apiController.adminSaveUser);
app.post('/api/admin/deleteuser', apiController.adminDeleteUser);

app.get('/api/logout', apiController.getUserLogout);

app.get("*", function(req, res) {
    res.render('index', {CDN: process.env.CDN || false, MIN: process.env.MIN || false});
});

/**
 * 500 Error Handler.
 */

app.use(errorHandler());

/**
 * Start Express server.
 */

app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});


module.exports = app;