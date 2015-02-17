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
var Room = require('./models/Room');
var Message = require('./models/Message');
var Group = require('./models/Group');

var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var socketioJwt = require('socketio-jwt');
var allUsers = {};
/**
 * Controllers (route handlers).
 */

var userController = require('./controllers/user');
var apiController = require('./controllers/api');
var socketController = require('./controllers/socket');

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
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);


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

    //User.find({email: 'cwalter94@berkeley.edu'}).remove(function(err) {
    //    if (err) console.log("err in user removal");
    //    console.log("user removal");
    //});
    //
    //Room.find({}).remove(function(err) {
    //    if (err) console.log("err in room removal");
    //    console.log("room removal");
    //});
    
    //function addUserToGroups(user, className) {
    //    return function() {
    //        var groupUrl = className.replace(/\s+/g,'').toLowerCase();
    //        Group.findOne({url: groupUrl}, function(err, group) {
    //            if (err) {
    //                console.log(err);
    //                return;
    //            }
    //            if (!group) {
    //                var newGroup = new Group({
    //                    name: className + ' Spring 2015',
    //                    url: groupUrl,
    //                    term: 'Spring 2015',
    //                    users: [user._id]
    //                });
    //
    //                newGroup.save(function(err) {
    //                    if (err) {
    //                        console.log("ERR IN CREATING GROUP ", newGroup);
    //                    }
    //                });
    //            } else {
    //                if (group.users.indexOf(user._id) == -1) {
    //                    group.users = group.users.concat([user._id]);
    //                    group.save(function(err) {
    //                        if (err) {
    //                            console.log("ERR IN ADDING USER TO GROUP ", user, group);
    //                            console.log(err);
    //                        }
    //                    });
    //                } else {
    //                    console.log("user" + user.name + " already in group " + group.name);
    //                }
    //
    //            }
    //        });
    //    }
    //}
    //
    //User.find({}, function(err, users) {
    //    if (err) {
    //        console.log(err);
    //        console.log("ERR IN FINDING USERS");
    //    } else {
    //        for (var i = 0; i < users.length; i++) {
    //            var user = users[i];
    //            for (var j = 0; j < user.classes.length; j++) {
    //                var userClass = user.classes[j];
    //                addUserToGroups(user, userClass)();
    //            }
    //        }
    //    }
    //})

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

app.get('/api/user', apiController.getUser);
app.get('/api/users', apiController.getUsersForUserIdsArr);
app.get('/api/users/browse', apiController.getUsersForBrowse); // params = num, start, sortBy
app.get('/api/userprofile', apiController.getUserProfile);
app.post('/api/userprofile', apiController.postUserProfile);
app.post('/api/userpicture', apiController.postUserPicture);
app.get('/api/user/deletepicture', apiController.deletePictureForReqUser);

app.get('/api/verify/send', apiController.sendEmail);
app.get('/api/verify/confirm', apiController.verifyEmail);

app.get('/api/room/all', apiController.getAllRoomsForReqUser);
app.get('/api/room/user/:userId', apiController.getRoomForUserIdAndReqUser);
app.get('/api/room/:roomId', apiController.getRoomForRoomId);
app.get('/api/room/:roomId/messages', apiController.getMessagesForRoomId);

app.get('/api/departments', apiController.getAllDepartments);
app.get('/api/courses', apiController.getCoursesForDepartment);

app.get('/api/admin/allusers', apiController.adminAllUsers);
app.post('/api/admin/saveuser', apiController.adminSaveUser);
app.post('/api/admin/deleteuser', apiController.adminDeleteUser);


app.get('/api/groups', apiController.getGroupsForReqUser);
app.get('/api/groups/:groupId/groupPosts', apiController.getGroupPostsForGroupId);
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
var io = require('socket.io').listen(app.listen(app.get('port'), function() {
    console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
}));

console.log("socket.io started successfully.");

io.set('authorization', socketioJwt.authorize({
    secret: secrets.jwt,
    handshake: true
}));

io.sockets.on("connection", socketController.socketHandler(allUsers));

module.exports = app;
