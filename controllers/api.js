var secrets = require('../config/secrets');
var User = require('../models/User');
var querystring = require('querystring');
var validator = require('validator');
var async = require('async');
var cheerio = require('cheerio');
var request = require('request');
var graph = require('fbgraph');
var LastFmNode = require('lastfm').LastFmNode;
var foursquare = require('node-foursquare')({secrets: secrets.foursquare});
var Twit = require('twit');
var stripe = require('stripe')(secrets.stripe.apiKey);
var twilio = require('twilio')(secrets.twilio.sid, secrets.twilio.token);
var clockwork = require('clockwork')({key: secrets.clockwork.apiKey});
var ig = require('instagram-node').instagram();
var Y = require('yui/yql');
var _ = require('lodash');
var passport = require('passport');
var multiparty = require('multiparty');
var uuid = require('uuid');
var fs = require('fs');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var AWS = require('aws-sdk');
var Mailgun = require('mailgun-js');
AWS.config.loadFromPath('./config/aws.json');
var Room = require('../models/Room');
var Message = require('../models/Message');
var mongoose = require('mongoose');
var gm = require('gm');
var rename = require('gulp-rename');
var Imagemin = require('imagemin');
/**
 * GET /api
 * List of API examples.
 */

exports.getApi = function (req, res) {
    res.render('api/index', {
        title: 'API Examples'
    });
};

exports.getUser = function (req, res) {
    if (req.user) {
        User.findOne({_id: req.user._id}, 'email picture name status statusCreated roles classes major minor verified', function (err, user) {

            if (err) {
                console.log(err);
                return res.send(401);
            }

            return res.json({user: user, token: req.token});

        });
    } else {
        return res.status(401).end();
    }
};

exports.getUsersForBrowse = function (req, res) {
    if (req.query.num && req.query.sortBy && req.query.start) {
        var selectString = '_id name email picture status classes statusCreated lastOnline';
        var sortString = req.query.sortBy;

        if (sortString == 'lastOnline') {
            sortString = '-' + req.query.sortBy;
        }

        User.find({_id: {"$ne": req.user._id}})
            .select(selectString)
            .skip(req.query.start)
            .limit(req.query.num)
            .sort(sortString)
            .exec(function (err, users) {
                if (err) {
                    console.log(err);
                    return res.status(401).end('An unknown error occurred. Please try again later.');
                }
                console.log(users);
                return res.json({token: req.token, users: users});
            });

    } else {
        return res.status(401).end('Number, start, and sort category are required.');
    }
};

exports.getAllRoomsForReqUser = function (req, res) {
    Room.find({users: req.user._id}, '_id users messages lastMessage lastMessageCreated', function (err, rooms) {
        console.log("ROOMS");
        console.log(rooms);
        console.log(req.user._id);
        if (err) {
            console.log(err);
            return res.status(401).end('An error occurred while retrieving message threads.');
        }
        return res.json({token: req.token, allRooms: rooms});
    });

};

exports.getMessagesForRoomId = function (req, res) {
    if (req.params.roomId) {
        Message.find({to: req.params.roomId}, 'from created text read', function (err, messages) {
            if (err) {
                console.log(err);
                return res.status(401).end('An error occurred while retrieving messages for this thread.');
            }
            return res.json({token: req.token, messageArr: messages});
        })
    } else {
        return res.status(401).end('Room id is required.');
    }
};

exports.getRoomForRoomId = function (req, res) {
    if (req.params.roomId) {
        Room.findOne({_id: req.params.roomId}, function (err, room) {
            if (err) {
                console.log(err);
                return res.status(401).end('An error occurred while locating this message thread.');
            }
            return res.json({token: req.token, room: room})
        });
    } else {
        return res.status(401).end('Room id is required to retrieve room info.');

    }
};

exports.getRoomForUserIdAndReqUser = function (req, res) {
    if (req.params.userId) {
        console.log(req.params.userId);
        Room.findOne({users: req.user._id, users: mongoose.Types.ObjectId.fromString(req.params.userId)}, function (err, room) {
            if (err) {
                console.log(err);
                return res.status(401).end('An error occurred while locating this message thread.');
            }
            if (room) {
                console.log("NO NEW ROOM");
                console.log(room);
                return res.json({token: req.token, room: room})
            } else {

                var newRoom = new Room({
                    users: [req.user._id, mongoose.Types.ObjectId.fromString(req.params.userId)]
                });
                newRoom.save(function (err) {
                    if (err) {
                        console.log(err);
                        return res.status(401).end('An error occurred while locating this message thread.');
                    }
                    console.log("NEW ROOM");
                    console.log(newRoom);
                    return res.json({
                        token: req.token, room: {
                            _id: newRoom._id,
                            users: newRoom.users,
                            messages: newRoom.messages
                        }
                    });
                });
            }
        })
    } else {
        return res.status(401).end('A second user ID must be supplied.');
    }
};

exports.getRoomToUsersForRoomId = function (req, res) {
    if (req.params.roomId) {

    } else {
        return res.status(401).end('Room id is required to retrieve user info.');
    }
};

exports.getUsersForUserIdsArr = function (req, res) {
    if (req.query.userIds) {
        if (typeof req.query.userIds != "object") {
            req.query.userIds = [req.query.userIds];
        }
        var userObjectIds = [];

        for (var i in req.query.userIds) {
            userObjectIds.push(mongoose.Types.ObjectId.fromString(req.query.userIds[i]))
        }
        User.find({_id: {"$in": userObjectIds}}, 'email status roles name email classes picture major minor', function (err, users) {
            if (err) {
                console.log(err);
                return res.status(401).end('An unknown error occurred while finding user data.');
            }
            return res.json({token: req.token, users: users});
        });

    } else {
        return res.status(401).end('User ids must be supplied as a query parameter.');
    }
};

exports.adminAllUsers = function (req, res) {
    if (req.user && req.user.roles && req.user.roles.indexOf('Admin') > -1) {
        User.find({}, 'email email roles status housePositions', function (err, users) {
            if (err) {
                console.log(err);
                return res.send(401);
            }

//            for (var i = 0; i < users.length; i++) {
//                var user = users[i];
//
//                if (!user.housePositions.length) {
//                    user.housePositions = [];
//                }
//                user.save(function(err) {
//                    if (err) return res.status(401).end();
//                });
//            }

            return res.json({token: req.token, users: users});
        })
    } else {
        return res.status(401).end();
    }
};

exports.adminSaveUser = function (req, res) {
    if (req.user && req.user.roles && req.user.roles.indexOf('Admin') > -1) {
        User.findOne({email: req.body.user.email}, function (err, user) {
            if (err) {
                console.log(err);
                return res.status(401).end();
            }

            user.roles = req.body.user.roles || user.roles;
            user.status = req.body.user.status || user.status;
            user.email = req.body.user.email || user.email;
            user.email = req.body.user.email || user.email;
            user.housePositions = req.body.user.housePositions;
            user.excomm = user.housePositions.length > 0;

            user.save(function (err) {
                if (err) return res.status(401).end();
                console.log(user);
                return res.json({token: req.token});
            });
        })
    } else {
        return res.status(401).end();
    }
};

exports.adminDeleteUser = function (req, res) {
    if (req.user && req.user.roles && req.user.roles.indexOf('Admin') > -1) {
        User.findOne({email: req.body.user.email}).remove(function (err) {
            if (err) return res.status(401).end('An unkown error occurred. Please try again later.');

            return res.json({data: {token: req.token}});
        });
    } else {
        return res.status(401).end('An unkown error occurred. Please try again later.');
    }
};

exports.authenticate = function (req, res, next) {
    var credentials = req.body.credentials || '';
    var email = '', password = '';

    if (credentials) {
        email = credentials.email || '';
        password = credentials.password || '';


        if (email == '' || password == '') {
            return res.status(401).end('Email and password are required.');
        }

    } else {
        return res.status(401).end('An error occurred during login. Please verify your credentials and try again.');
    }

    User.findOne({email: email}, 'email name status classes verified major minor', function (err, user) {

        if (err) {
            console.log(err);
            return res.status(401).end('An unknown error occurred. Please try again later.');
        }
        if (!user) {
            return res.status(401).end('Incorrect email or password.');
        }

        user.comparePassword(password, function (isMatch) {
            if (!isMatch) {
                return res.status(401).end('Incorrect email or password.');
            }

            var token = jwt.sign({_id: user._id, email: user.email}, secrets.jwt, {expiresInDays: 7});
            return res.json({user: user, token: token});
        });

    });
};

exports.register = function (req, res, next) {

    var email = req.body.email || '';
    var password = req.body.password || '';
    var name = req.body.name || "";
    var major = req.body.major || [];
    var minor = req.body.minor || [];
    var classes = req.body.classes || [];
    var roles = req.body.roles || [];
    var expiredTokens = [];

    if (email == '' || password == '') {
        return res.status(401).end('Valid email and password required.');
    } else if (password !== req.body.repassword) {
        return res.status(401).end('Password and confirmation must match.');
    } else if (email.indexOf('@berkeley.edu') == -1) {
        return res.status(401).end('Only berkeley.edu emails are accepted at this time.')
    }

    var user = new User({
        name: name,
        email: email,
        password: password,
        classes: classes,
        major: major,
        minor: minor,
        roles: roles,
        verified: false
    });

    user.save(function (err) {
        if (err) return res.status(401).end('User with that email already exists.');

        var mailgun = new Mailgun({apiKey: secrets.mailgun.apiKey, domain: 'twerk.io'});

        var emaildata = {
            //Specify email data
            from: 'admin@twerk.io',
            //The email to contact
            to: email,
            //Subject and text data
            subject: 'Twerk.io Account Verification',
            text: 'Thanks for signing up for twerk.io! Navigate to the following URL to verify your email account: www.twerk.io/verify/' + user._id
        };

        mailgun.messages().send(emaildata, function (err, body) {
            //If there is an error, render the error page
            if (err) {
                console.log(err);
                return res.status(401).end('An error occurred while sending the registration email. Please try again later.');
            }
            else {
                var token = jwt.sign({
                    email: user.email,
                    roles: user.roles,
                    verified: false
                }, secrets.jwt, {expiresInDays: 7});
                return res.json({
                    token: token,
                    user: {email: email, classes: classes, roles: roles, major: major, minor: minor}
                });
            }
        });
    });
};

exports.getUserProfile = function (req, res, next) {

    if (req.user) {
        User.findOne({email: req.user.email},
            'email status roles name email classes picture major minor verified',

            function (err, user) {

                if (err || !user) {
                    return res.send(401);
                }

                return res.json({user: user, token: req.token});

            });

    } else {
        return res.status(401).end('An unknown problem occurred. Please try again later.')
    }
};


exports.postUserProfile = function (req, res, next) {
    var userUpdate = req.body.data;

    User.findOne({email: req.user.email}, function (err, user) {

        if (err) {
            return res.status(401).end('A user with that email already exists.');
        }

        user.email = userUpdate.email || user.email;
        user.status = userUpdate.status || user.status;
        if (user.status == userUpdate.status) {
            user.statusCreated = Date.now();
        }
        user.name = userUpdate.name || user.name;
        user.major = userUpdate.major || user.major;
        user.minor = userUpdate.minor || user.minor;
        user.roles = userUpdate.roles || user.roles;
        user.classes = userUpdate.classes || user.classes;

        user.save(function (err) {
            if (err) return res.status(401).end('An error occurred. Please try again later.');
            return res.json({token: req.body.token});
        });
    });

};

exports.postUserPicture = function (req, res, next) {
    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {

        var file = files.file[0];
        var contentType = file.headers['content-type'];
        var tmpPath = file.path;

        if (contentType !== 'image/png' && contentType !== 'image/jpeg') {
            fs.unlink(tmpPath);
            return res.status(401).end('Unsupported file type. Please upload a JPEG or PNG image.');
        }

        var extIndex = tmpPath.lastIndexOf('.');
        var extension = (extIndex < 0) ? '' : tmpPath.substr(extIndex);
        // uuid is for generating unique filenames.
        var fileName = uuid.v4() + extension;

        var newSize = 512;
        var thumbnailSize = 100;

        var compressionAlg = "";
        var newPath = tmpPath.substring(0, tmpPath.lastIndexOf('/') + 1) + fileName;
        var thumbnailPath = tmpPath.substring(0, tmpPath.lastIndexOf('/') + 1) + 'thumbnail' + extension;

        if (contentType == 'image/jpeg') {
            gm(tmpPath)
                .resize(newSize, newSize)
                .compress('JPEG')
                .write(newPath, function (err) {
                    if (err) {
                        console.log(err);
                        return res.status(401).end('An error occurred during image upload. Please try again later.');
                    }
                    gm(newPath)
                        .resize(thumbnailSize, thumbnailSize)
                        .compress('JPEG')
                        .write(thumbnailPath, function(err) {

                            var bucket = new AWS.S3({params: {Bucket: 'twerk.io/img/members'}});
                            var thumbnailBucket = new AWS.S3({params: {Bucket: 'twerk.io/img/members/thumbnails'}});

                            var stream = fs.createReadStream(newPath);
                            var thumbnailStream = fs.createReadStream(thumbnailPath);

                            var data = {Key: fileName, Body: stream};
                            var thumbnailData = {Key: fileName, Body: thumbnailStream};

                            bucket.putObject(data, function (err, data) {
                                if (err) {
                                    console.log(err);
                                    return res.status(401).end("Image could not be saved. Please try again later.");
                                }
                                var oldPic = "", delParams = null, deleteOldPic = true;

                                if (req.user.picture && req.user.picture != '/img/generic_avatar.gif') {
                                    oldPic = req.user.picture.substring(req.user.picture.lastIndexOf('/') + 1);
                                    delParams = {Key: oldPic};
                                } else {
                                    deleteOldPic = false;
                                }

                                thumbnailBucket.putObject(thumbnailData, function (err, data) {
                                    if (err) {
                                        console.log(err);
                                        return res.status(401).end("Thumbnail could not be saved. Please try again later.");
                                    }

                                    User.findOne({_id: req.user._id}, 'picture', function (err, user) {
                                        if (err || user == null) {
                                            console.log(err);
                                            return res.status(401).end('Image could not be updated. Please try again later.');
                                        }


                                        var url = 'https://s3-us-west-1.amazonaws.com/twerk.io/img/members/' + fileName;
                                        user.picture = url;
                                        user.save(function (err) {
                                            if (err) {
                                                console.log(err);
                                                return res.status(401).end('Image could not be updated. Please try again later.')
                                            }



                                            if (deleteOldPic) {
                                                bucket.deleteObject(delParams, function (err, data) {
                                                    if (err) {
                                                        return res.status(401).end('Old image could not be deleted. Please try again later.');
                                                    }
                                                    thumbnailBucket.deleteObject(delParams, function (err, data) {
                                                        if (err) {
                                                            return res.status(401).end('Old thumbnail could not be removed. Please try again later.');
                                                        }

                                                        return res.json({picture: url, token: req.token});
                                                    });
                                                });

                                            } else {
                                                return res.json({picture: url, token: req.token});

                                            }

                                        });

                                    });
                                });
                        });
                    });

                });
        }
        else {
            //resize with gm and minify with imagemin
            gm(tmpPath)
                .resize(newSize, newSize)
                .write(newPath, function (err) {
                    if (err) {
                        console.log(err);
                        return res.status(401).end('An error occurred during image upload. Please try again later.');
                    }

                    gm(newPath)
                        .resize(thumbnailSize, thumbnailSize)
                        .write(thumbnailPath, function(err) {
                            var imagemin = new Imagemin()
                                .src(newPath)
                                .dest(tmpPath.substring(0, tmpPath.lastIndexOf('/') + 1))
                                .use(rename('imagemin.png'))
                                .use(Imagemin.pngquant())
                                .run(function (err, files) {
                                    if (err) {
                                        console.log(err);
                                        return res.status(401).end('An error occurred during image upload. Please try again later.');
                                    }
                                    imagemin = new Imagemin()
                                        .src(thumbnailPath)
                                        .dest(tmpPath.substring(0, tmpPath.lastIndexOf('/') + 1))
                                        .use(rename('imageminthumbnail.png'))
                                        .use(Imagemin.pngquant())
                                        .run(function (err, thumbnailFiles) {


                                            var bucket = new AWS.S3({params: {Bucket: 'twerk.io/img/members'}});
                                            var thumbnailBucket = new AWS.S3({params: {Bucket: 'twerk.io/img/members/thumbnails'}});

                                            var stream = fs.createReadStream(tmpPath.substring(0, tmpPath.lastIndexOf('/') + 1) + 'imagemin.png');
                                            var thumbnailStream = fs.createReadStream(tmpPath.substring(0, tmpPath.lastIndexOf('/') + 1) + 'imageminthumbnail.png');

                                            var data = {Key: fileName, Body: stream};
                                            var thumbnailData = {Key: fileName, Body: thumbnailStream};

                                            bucket.putObject(data, function (err, data) {
                                                if (err) {
                                                    console.log(err);
                                                    return res.status(401).end("Image could not be saved. Please try again later.");
                                                }
                                                var oldPic = "", delParams = null, deleteOldPic = true;

                                                if (req.user.picture && req.user.picture != '/img/generic_avatar.gif') {
                                                    oldPic = req.user.picture.substring(req.user.picture.lastIndexOf('/') + 1);
                                                    delParams = {Key: oldPic};
                                                } else {
                                                    deleteOldPic = false;
                                                }

                                                thumbnailBucket.putObject(thumbnailData, function (err, data) {
                                                    if (err) {
                                                        console.log(err);
                                                        return res.status(401).end('An error occurred during thumbnail upload. Please try again later.');
                                                    }

                                                    User.findOne({_id: req.user._id}, 'picture', function (err, user) {
                                                        if (err || user == null) {
                                                            console.log(err);
                                                            return res.status(401).end('Image could not be updated. Please try again later.');
                                                        }


                                                        var url = 'https://s3-us-west-1.amazonaws.com/twerk.io/img/members/' + fileName;
                                                        user.picture = url;
                                                        user.save(function (err) {
                                                            if (err) {
                                                                console.log(err);
                                                                return res.status(401).end('Image could not be updated. Please try again later.')
                                                            }

                                                            if (deleteOldPic) {
                                                                bucket.deleteObject(delParams, function (err, data) {
                                                                    if (err) {
                                                                        return res.status(401).end('Old thumbnail could not be deleted. Please try again later.');
                                                                    }
                                                                    thumbnailBucket.deleteObject(delParams, function (err, data) {
                                                                        if (err) {
                                                                            return res.status(401).end('Old thumbnail could not be removed. Please try again later.');
                                                                        }

                                                                        return res.json({
                                                                            picture: url,
                                                                            token: req.token
                                                                        });
                                                                    });
                                                                });
                                                            } else {
                                                                return res.json({picture: url, token: req.token});

                                                            }

                                                        });


                                                    });

                                                })
                                            });
                                        });
                                });
                        });

                });

        }


    });
};

exports.getUserLogout = function (req, res, next) {

    User.findOne({email: req.user.email}, function (err, user) {

        if (err) {
            console.log(err);
            return res.status(401).end();
        }

        user.expiredtokens.push(req.headers.authorization.split(' ')[1]);

        user.save(function (err) {
            if (err) return next(err);
            return res.json({user: null, token: null});
        });


    });
};

exports.getMessages = function (req, res, next) {
    if (req.params.roomId) {
        Room.findOne({_id: req.params.roomId}, 'messages', function (err, room) {
            if (err) {
                console.log(err);
            } else {
                Message.find({id: {'$in': room.messages}}, 'from text', '-time', function (err, messages) {
                    if (err) console.log(err);
                    if (messages.length > 0) {
                        return res.json({token: req.token, room: room._id, messages: messages});
                    }
                });
            }
        });
    } else {
        Room.find({
            users: req.user._id,
            messages: {"$not": {"$size": 0}}
        }, 'id lastMessage users usersNames', function (err, rooms) {
            if (err) return res.status(401).end('An unknown error occurred. Please try again later.');
            console.log(rooms);
            return res.json({token: req.token, rooms: rooms})
        });

    }
};

exports.verifyEmail = function (req, res, next) {
    console.log(req.query.code);
    User.findOne({_id: req.query.code}, '_id', function (err, user) {

        if (err) {
            console.log(err);
            return res.status(401).end('An unknown error occurred. Please try again later.');
        }

        if (user && !user.verified) {
            user.verified = true;
            user.save(function (err) {
                if (err) {
                    console.log(err);
                    return res.status(401).end('An unknown error occurred. Please try again later.');
                }
                var token = jwt.sign({email: user.email, roles: user.roles}, secrets.jwt, {expiresInDays: 7});
                return res.json({token: token});
            })

        } else if (user && user.verified) {
            return res.status(401).end('User already verified.');
        } else {
            return res.status(401).end('An unknown error occurred. Please try again later.');

        }
    });
};

exports.sendEmail = function (req, res, next) {
    if (req.user) {
        var mailgun = new Mailgun({apiKey: secrets.mailgun.apiKey, domain: 'twerk.io'});

        var emaildata = {
            //Specify email data
            from: 'admin@twerk.io',
            //The email to contact
            to: req.user.email,
            //Subject and text data
            subject: 'Twerk.io Account Verification',
            text: 'Thanks for signing up for twerk.io! Navigate to the following URL to verify your email account: www.twerk.io/verify/' + req.user._id
        };

        mailgun.messages().send(emaildata, function (err, body) {
            //If there is an error, render the error page
            if (err) {
                console.log(err);
                return res.status(401).end('An error occurred while sending the verification email. Please try again later.');
            }
            else {
                var token = jwt.sign({
                    email: req.user.email,
                    roles: req.user.roles,
                    verified: req.user.verified
                }, secrets.jwt, {expiresInDays: 7});
                return res.json({token: token, email: req.user.email});
            }
        });
    } else {
        res.status(401).end('Please login and reload this page before trying to send another verification email.')
    }
};
/**
 * DO NOT USE THIS FUNCTION FOR ANYTHING EXCEPT DEBUGGING
 * (used for resetting password manually, if password is lost)
 * @param req
 * @param res
 * @param next
 */

exports.manualResetPassword = function (req, res, next) {
    if (req.body.password === undefined) {
        return res.status(401).end();
    }

    User.findOne({email: req.body.email}, function (err, user) {
        if (err) return next(err);

        user.email = req.body.email;
        user.password = req.body.password;

        user.save(function (err) {
            if (err) return next(err);
            return res.status(200).end();
        });

    });
};

/**
 * GET /api/foursquare
 * Foursquare API example.
 */

exports.getFoursquare = function (req, res, next) {
    var token = _.find(req.user.tokens, {kind: 'foursquare'});
    async.parallel({
            trendingVenues: function (callback) {
                foursquare.Venues.getTrending('40.7222756', '-74.0022724', {limit: 50}, token.accessToken, function (err, results) {
                    callback(err, results);
                });
            },
            venueDetail: function (callback) {
                foursquare.Venues.getVenue('49da74aef964a5208b5e1fe3', token.accessToken, function (err, results) {
                    callback(err, results);
                });
            },
            userCheckins: function (callback) {
                foursquare.Users.getCheckins('self', null, token.accessToken, function (err, results) {
                    callback(err, results);
                });
            }
        },
        function (err, results) {
            if (err) return next(err);
            res.render('api/foursquare', {
                title: 'Foursquare API',
                trendingVenues: results.trendingVenues,
                venueDetail: results.venueDetail,
                userCheckins: results.userCheckins
            });
        });
};

/**
 * GET /api/tumblr
 * Tumblr API example.
 */

exports.getTumblr = function (req, res) {
    var token = _.find(req.user.tokens, {kind: 'tumblr'});
    var client = tumblr.createClient({
        consumer_key: secrets.tumblr.consumerKey,
        consumer_secret: secrets.tumblr.consumerSecret,
        token: token.accessToken,
        token_secret: token.tokenSecret
    });
    client.posts('withinthisnightmare.tumblr.com', {type: 'photo'}, function (err, data) {
        res.render('api/tumblr', {
            title: 'Tumblr API',
            blog: data.blog,
            photoset: data.posts[0].photos
        });
    });
};

/**
 * GET /api/facebook
 * Facebook API example.
 */

exports.getFacebook = function (req, res, next) {
    var token = _.find(req.user.tokens, {kind: 'facebook'});
    graph.setAccessToken(token.accessToken);
    async.parallel({
            getMe: function (done) {
                graph.get(req.user.facebook, function (err, me) {
                    done(err, me);
                });
            },
            getMyFriends: function (done) {
                graph.get(req.user.facebook + '/friends', function (err, friends) {
                    done(err, friends.data);
                });
            }
        },
        function (err, results) {
            if (err) return next(err);
            res.render('api/facebook', {
                title: 'Facebook API',
                me: results.getMe,
                friends: results.getMyFriends
            });
        });
};

/**
 * GET /api/scraping
 * Web scraping example using Cheerio library.
 */

exports.getScraping = function (req, res, next) {
    request.get('https://news.ycombinator.com/', function (err, request, body) {
        if (err) return next(err);
        var $ = cheerio.load(body);
        var links = [];
        $(".title a[href^='http'], a[href^='https']").each(function () {
            links.push($(this));
        });
        res.render('api/scraping', {
            title: 'Web Scraping',
            links: links
        });
    });
};

/**
 * GET /api/github
 * GitHub API Example.
 */
exports.getGithub = function (req, res) {
    var token = _.find(req.user.tokens, {kind: 'github'});
    var github = new Github({token: token.accessToken});
    var repo = github.getRepo('sahat', 'requirejs-library');
    repo.show(function (err, repo) {
        res.render('api/github', {
            title: 'GitHub API',
            repo: repo
        });
    });

};

/**
 * GET /api/aviary
 * Aviary image processing example.
 */

exports.getAviary = function (req, res) {
    res.render('api/aviary', {
        title: 'Aviary API'
    });
};

/**
 * GET /api/nyt
 * New York Times API example.
 */

exports.getNewYorkTimes = function (req, res, next) {
    var query = querystring.stringify({'api-key': secrets.nyt.key, 'list-name': 'young-adult'});
    var url = 'http://api.nytimes.com/svc/books/v2/lists?' + query;
    request.get(url, function (error, request, body) {
        if (request.statusCode === 403) return next(Error('Missing or Invalid New York Times API Key'));
        var bestsellers = JSON.parse(body);
        res.render('api/nyt', {
            title: 'New York Times API',
            books: bestsellers.results
        });
    });
};

/**
 * GET /api/lastfm
 * Last.fm API example.
 */

exports.getLastfm = function (req, res, next) {
    var lastfm = new LastFmNode(secrets.lastfm);
    async.parallel({
            artistInfo: function (done) {
                lastfm.request('artist.getInfo', {
                    artist: 'Sirenia',
                    handlers: {
                        success: function (data) {
                            done(null, data);
                        },
                        error: function (err) {
                            done(err);
                        }
                    }
                });
            },
            artistTopTracks: function (done) {
                lastfm.request('artist.getTopTracks', {
                    artist: 'Sirenia',
                    handlers: {
                        success: function (data) {
                            var tracks = [];
                            _.each(data.toptracks.track, function (track) {
                                tracks.push(track);
                            });
                            done(null, tracks.slice(0, 10));
                        },
                        error: function (err) {
                            done(err);
                        }
                    }
                });
            },
            artistTopAlbums: function (done) {
                lastfm.request('artist.getTopAlbums', {
                    artist: 'Sirenia',
                    handlers: {
                        success: function (data) {
                            var albums = [];
                            _.each(data.topalbums.album, function (album) {
                                albums.push(album.image.slice(-1)[0]['#text']);
                            });
                            done(null, albums.slice(0, 4));
                        },
                        error: function (err) {
                            done(err);
                        }
                    }
                });
            }
        },
        function (err, results) {
            if (err) return next(err.message);
            var artist = {
                name: results.artistInfo.artist.name,
                image: results.artistInfo.artist.image.slice(-1)[0]['#text'],
                tags: results.artistInfo.artist.tags.tag,
                bio: results.artistInfo.artist.bio.summary,
                stats: results.artistInfo.artist.stats,
                similar: results.artistInfo.artist.similar.artist,
                topAlbums: results.artistTopAlbums,
                topTracks: results.artistTopTracks
            };
            res.render('api/lastfm', {
                title: 'Last.fm API',
                artist: artist
            });
        });
};

/**
 * GET /api/twitter
 * Twiter API example.
 */

exports.getTwitter = function (req, res, next) {
    var token = _.find(req.user.tokens, {kind: 'twitter'});
    var T = new Twit({
        consumer_key: secrets.twitter.consumerKey,
        consumer_secret: secrets.twitter.consumerSecret,
        access_token: token.accessToken,
        access_token_secret: token.tokenSecret
    });
    T.get('search/tweets', {
        q: 'nodejs since:2013-01-01',
        geocode: '40.71448,-74.00598,5mi',
        count: 10
    }, function (err, reply) {
        if (err) return next(err);
        res.render('api/twitter', {
            title: 'Twitter API',
            tweets: reply.statuses
        });
    });
};

/**
 * POST /api/twitter
 * @param tweet
 */

exports.postTwitter = function (req, res, next) {
    req.assert('tweet', 'Tweet cannot be empty.').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/api/twitter');
    }

    var token = _.find(req.user.tokens, {kind: 'twitter'});
    var T = new Twit({
        consumer_key: secrets.twitter.consumerKey,
        consumer_secret: secrets.twitter.consumerSecret,
        access_token: token.accessToken,
        access_token_secret: token.tokenSecret
    });
    T.post('statuses/update', {status: req.body.tweet}, function (err, data, response) {
        req.flash('success', {msg: 'Tweet has been posted.'});
        res.redirect('/api/twitter');
    });
};

/**
 * GET /api/steam
 * Steam API example.
 */

exports.getSteam = function (req, res, next) {
    var steamId = '76561197982488301';
    var query = {l: 'english', steamid: steamId, key: secrets.steam.apiKey};

    async.parallel({
            playerAchievements: function (done) {
                query.appid = '49520';
                var qs = querystring.stringify(query);
                request.get({
                    url: 'http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?' + qs,
                    json: true
                }, function (error, request, body) {
                    if (request.statusCode === 401) return done(new Error('Missing or Invalid Steam API Key'));
                    done(error, body);
                });
            },
            playerSummaries: function (done) {
                query.steamids = steamId;
                var qs = querystring.stringify(query);
                request.get({
                    url: 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?' + qs,
                    json: true
                }, function (error, request, body) {
                    if (request.statusCode === 401) return done(new Error('Missing or Invalid Steam API Key'));
                    done(error, body);
                });
            },
            ownedGames: function (done) {
                query.include_appinfo = 1;
                query.include_played_free_games = 1;
                var qs = querystring.stringify(query);
                request.get({
                    url: 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?' + qs,
                    json: true
                }, function (error, request, body) {
                    if (request.statusCode === 401) return done(new Error('Missing or Invalid Steam API Key'));
                    done(error, body);
                });
            }
        },
        function (err, results) {
            if (err) return next(err);
            res.render('api/steam', {
                title: 'Steam Web API',
                ownedGames: results.ownedGames.response.games,
                playerAchievemments: results.playerAchievements.playerstats,
                playerSummary: results.playerSummaries.response.players[0]
            });
        });
};

/**
 * GET /api/stripe
 * Stripe API example.
 */

exports.getStripe = function (req, res) {
    res.render('api/stripe', {
        title: 'Stripe API'
    });
};

/**
 * POST /api/stripe
 * @param stipeToken
 * @param stripeEmail
 */

exports.postStripe = function (req, res, next) {
    var stripeToken = req.body.stripeToken;
    var stripeEmail = req.body.stripeEmail;

    stripe.charges.create({
        amount: 395,
        currency: 'usd',
        card: stripeToken,
        description: stripeEmail
    }, function (err, charge) {
        if (err && err.type === 'StripeCardError') {
            req.flash('errors', {msg: 'Your card has been declined.'});
            res.redirect('/api/stripe');
        }
        req.flash('success', {msg: 'Your card has been charged successfully.'});
        res.redirect('/api/stripe');
    });
};

/**
 * GET /api/twilio
 * Twilio API example.
 */

exports.getTwilio = function (req, res) {
    res.render('api/twilio', {
        title: 'Twilio API'
    });
};

/**
 * POST /api/twilio
 * Twilio API example.
 * @param number
 * @param message
 */

exports.postTwilio = function (req, res, next) {
    req.assert('number', 'Phone number is required.').notEmpty();
    req.assert('message', 'Message cannot be blank.').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/api/twilio');
    }

    var message = {
        to: req.body.number,
        from: '+13472235148',
        body: req.body.message
    };

    twilio.sendMessage(message, function (err, responseData) {
        if (err) return next(err.message);
        req.flash('success', {msg: 'Text sent to ' + responseData.to + '.'});
        res.redirect('/api/twilio');
    });
};

/**
 * GET /api/clockwork
 * Clockwork SMS API example.
 */

exports.getClockwork = function (req, res) {
    res.render('api/clockwork', {
        title: 'Clockwork SMS API'
    });
};

/**
 * POST /api/clockwork
 * Clockwork SMS API example.
 * @param telephone
 */

exports.postClockwork = function (req, res, next) {
    var message = {
        To: req.body.telephone,
        From: 'Hackathon',
        Content: 'Hello from the Hackathon Starter'
    };
    clockwork.sendSms(message, function (err, responseData) {
        if (err) return next(err.errDesc);
        req.flash('success', {msg: 'Text sent to ' + responseData.responses[0].to});
        res.redirect('/api/clockwork');
    });
};

/**
 * GET /api/venmo
 * Venmo API example.
 */

exports.getVenmo = function (req, res, next) {
    var token = _.find(req.user.tokens, {kind: 'venmo'});
    var query = querystring.stringify({access_token: token.accessToken});

    async.parallel({
            getProfile: function (done) {
                request.get({url: 'https://api.venmo.com/v1/me?' + query, json: true}, function (err, request, body) {
                    done(err, body);
                });
            },
            getRecentPayments: function (done) {
                request.get({
                    url: 'https://api.venmo.com/v1/payments?' + query,
                    json: true
                }, function (err, request, body) {
                    done(err, body);

                });
            }
        },
        function (err, results) {
            if (err) return next(err);
            res.render('api/venmo', {
                title: 'Venmo API',
                profile: results.getProfile.data,
                recentPayments: results.getRecentPayments.data
            });
        });
};

/**
 * POST /api/venmo
 * @param user
 * @param note
 * @param amount
 * Send money.
 */

exports.postVenmo = function (req, res, next) {
    req.assert('user', 'Phone, Email or Venmo User ID cannot be blank').notEmpty();
    req.assert('note', 'Please enter a message to accompany the payment').notEmpty();
    req.assert('amount', 'The amount you want to pay cannot be blank').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/api/venmo');
    }

    var token = _.find(req.user.tokens, {kind: 'venmo'});

    var formData = {
        access_token: token.accessToken,
        note: req.body.note,
        amount: req.body.amount
    };

    if (validator.isEmail(req.body.user)) {
        formData.email = req.body.user;
    } else if (validator.isNumeric(req.body.user) &&
        validator.isLength(req.body.user, 10, 11)) {
        formData.phone = req.body.user;
    } else {
        formData.user_id = req.body.user;
    }

    request.post('https://api.venmo.com/v1/payments', {form: formData}, function (err, request, body) {
        if (err) return next(err);
        if (request.statusCode !== 200) {
            req.flash('errors', {msg: JSON.parse(body).error.message});
            return res.redirect('/api/venmo');
        }
        req.flash('success', {msg: 'Venmo money transfer complete'});
        res.redirect('/api/venmo');
    });
};

/**
 * GET /api/linkedin
 * LinkedIn API example.
 */

exports.getLinkedin = function (req, res, next) {
    var token = _.find(req.user.tokens, {kind: 'linkedin'});
    var linkedin = Linkedin.init(token.accessToken);

    linkedin.people.me(function (err, $in) {
        if (err) return next(err);
        res.render('api/linkedin', {
            title: 'LinkedIn API',
            profile: $in
        });
    });
};

/**
 * GET /api/instagram
 * Instagram API example.
 */

exports.getInstagram = function (req, res, next) {
    var token = _.find(req.user.tokens, {kind: 'instagram'});

    ig.use({client_id: secrets.instagram.clientID, client_secret: secrets.instagram.clientSecret});
    ig.use({access_token: token.accessToken});

    async.parallel({
        searchByemail: function (done) {
            ig.user_search('richellemead', function (err, users, limit) {
                done(err, users);
            });
        },
        searchByUserId: function (done) {
            ig.user('175948269', function (err, user) {
                done(err, user);
            });
        },
        popularImages: function (done) {
            ig.media_popular(function (err, medias) {
                done(err, medias);
            });
        },
        myRecentMedia: function (done) {
            ig.user_self_media_recent(function (err, medias, pagination, limit) {
                done(err, medias);
            });
        }
    }, function (err, results) {
        if (err) return next(err);
        res.render('api/instagram', {
            title: 'Instagram API',
            emails: results.searchByemail,
            userById: results.searchByUserId,
            popularImages: results.popularImages,
            myRecentMedia: results.myRecentMedia
        });
    });
};

/**
 * GET /api/yahoo
 * Yahoo API example.
 */
exports.getYahoo = function (req, res) {
    Y.YQL('SELECT * FROM weather.forecast WHERE (location = 10007)', function (response) {
        var location = response.query.results.channel.location;
        var condition = response.query.results.channel.item.condition;
        res.render('api/yahoo', {
            title: 'Yahoo API',
            location: location,
            condition: condition
        });
    });
};