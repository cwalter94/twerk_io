var secrets = require('../config/secrets');
var User = require('../models/User');
var Group = require('../models/Group');
var GroupPost = require('../models/GroupPost');
var Comment = require('../models/Comment');


var querystring = require('querystring');
var validator = require('validator');
var async = require('async');
var cheerio = require('cheerio');
var request = require('request');
var foursquare = require('node-foursquare')({secrets: secrets.foursquare});
var Twit = require('twit');
var stripe = require('stripe')(secrets.stripe.apiKey);

var Y = require('yui/yql');
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
var courses = require('./courses.json');
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
        User.findOne({_id: req.user._id}, 'email picture name status statusCreated roles classes major minor verified groups', function (err, user) {

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
        var sortString = '-statusCreated';


        User.find({_id: {"$ne": req.user._id}})
            .select(selectString)
            .skip(req.query.start)
            .sort(sortString)
            .exec(function (err, users) {
                if (err) {
                    console.log(err);
                    return res.status(401).end('An unknown error occurred. Please try again later.');
                }
                return res.json({token: req.token, users: users});
            });

    } else {
        return res.status(401).end('Number, start, and sort category are required.');
    }
};

exports.getGroupsForReqUser = function (req, res) {
    Group.find({users: req.user._id}, function (err, groups) {
        if (err) {
            console.log(err);
            return res.status(401).end('An error occurred while retrieving groups.');
        }
        return res.json({token: req.token, groups: groups});
    });
};

exports.getGroupPostsForGroupId = function (req, res) {
    if (!req.params.groupId) {
        return res.status(401).end('Group URL is required to find posts');
    }

    GroupPost.find({groupId: req.params.groupId}, function(err, groupPosts) {
        if (err) {
           console.log(err);
           return res.status(401).end('An error occurred while finding Group Posts. Please try again later.');
        }
        return res.json({token: req.token, groupPosts: groupPosts});
    });
};

exports.getAllRoomsForReqUser = function (req, res) {
    Room.find({users: req.user._id}, '_id users messages lastMessage lastMessageCreated unreadMessages', function (err, rooms) {
        if (err) {
            console.log(err);
            return res.status(401).end('An error occurred while retrieving message threads.');
        }
        return res.json({token: req.token, allRooms: rooms});
    });

};

exports.getMessagesForRoomId = function (req, res) {
    if (req.params.roomId) {
        Room.findById(mongoose.Types.ObjectId(req.params.roomId), 'users unreadMessages', function(err, room) {
            if (err) {
                console.log(err);
                return res.status(401).end('An error occurred while retrieving messages for this thread.');
            }
            if (room && room.users.indexOf(req.user._id) > -1) {
                    Message.find({to: mongoose.Types.ObjectId(req.params.roomId)}, 'from createdAt text read', function (err, messages) {
                        if (err) {
                            console.log(err);
                            return res.status(401).end('An error occurred while retrieving messages for this thread.');
                        }

                        if (messages) {
                            return res.json({token: req.token, messageArr: messages});

                        } else {
                            return res.status(401).end("Sorry, we couldn't retrieve the messages for this thread");
                        }
                    });
            } else {
                res.status(401).end("Sorry, we couldn't find that room");
            }

        });

    } else {
        return res.status(401).end('Room id is required.');
    }
};

exports.getRoomForRoomId = function (req, res) {
    if (req.params.roomId) {
        Room.findById(mongoose.Types.ObjectId(req.params.roomId), function (err, room) {
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
        Room.findOne({"$and" : [{users: req.user._id}, {users: mongoose.Types.ObjectId(req.params.userId)}]}, function (err, room) {

            if (err) {
                console.log(err);
                return res.status(401).end('An error occurred while locating this message thread.');
            }
            if (room) {
                return res.json({token: req.token, room: room})
            } else {


                var newRoom = new Room({
                    users: [req.user._id, mongoose.Types.ObjectId(req.params.userId)],
                    unreadMessages: ['' + req.user._id + '.0', '' + mongoose.Types.ObjectId(req.params.userId) + '.0']
                });

                newRoom.save(function (err) {
                    if (err) {
                        console.log(err);
                        return res.status(401).end('An error occurred while locating this message thread.');
                    }

                    return res.json({
                        token: req.token, room: {
                            _id: newRoom._id,
                            users: newRoom.users,
                            messages: newRoom.messages,
                            unreadMessages: newRoom.unreadMessages
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
            userObjectIds.push(mongoose.Types.ObjectId(req.query.userIds[i]))
        }
        User.find({_id: {"$in": userObjectIds}}, 'email status roles name email classes picture major minor groups', function (err, users) {
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

exports.deletePictureForReqUser = function (req, res) {
    var bucket = new AWS.S3({params: {Bucket: 'twerk.io/img/members'}});
    var thumbnailBucket = new AWS.S3({params: {Bucket: 'twerk.io/img/members/thumbnails'}});
    var oldPic = req.user.picture.substring(req.user.picture.lastIndexOf('/') + 1);
    var delParams = {Key: oldPic};
    User.findById(req.user._id, 'picture', function (err, user) {
        if (err || user == null) {
            console.log(err);
            return res.status(401).end('Image could not be deleted. Please try again later.');
        }

        user.picture = "";

        user.save(function (err) {
            if (err) {
                console.log(err);
                return res.status(401).end('Image could not be updated. Please try again later.')
            }

            bucket.deleteObject(delParams, function (err, data) {
                if (err) {
                    return res.status(401).end('Image could not be deleted. Please try again later.');
                }
                thumbnailBucket.deleteObject(delParams, function (err, data) {
                    if (err) {
                        return res.status(401).end('Thumbnail could not be removed. Please try again later.');
                    }

                    return res.json({picture: '/img/generic_avatar.gif', token: req.token});
                });
            });

        });

    });
};

exports.getCoursesForDepartment = function (req, res) {
    if (req.query.department) {
        for (var i = 0; i < courses.length; i++) {
            if (req.query.department.indexOf(courses[i].name) > -1 || req.query.department.indexOf(courses[i].abbreviation) > -1) {
                return res.json({token: req.token, courses: courses[i].courses})
            }
        }
        return res.status(401).end('No courses found.');
    }

    return res.status(401).end('Department required.');
};

exports.getAllDepartments = function (req, res) {
    var result = [];

    for (var i = 0; i < courses.length; i++) {
        result.push(courses[i].name + '(' + courses[i].abbreviation + ')');
    }
    return res.json({token: req.token, departments: result});
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

    User.findOne({email: email}, 'email name status classes verified statusCreated picture lastOnline groups', function (err, user) {

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
            text: 'Thanks for signing up for twerk.io! Your verification code is: ' + user._id + '. Navigate to the following URL to verify your email account: http://www.twerk.io/verify/' + user._id
            + " (you may need to login again before trying the link). If the link doesn't work for you, try inputting the code manually on the verification page."
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
                    _id: user._id,
                    verified: false
                }, secrets.jwt, {expiresInDays: 7});
                return res.json({
                    token: token,
                    user: {_id: user._id, classes: classes, roles: roles, verified: false}
                });
            }
        });
    });
};

exports.getUserProfile = function (req, res, next) {

    if (req.user) {
        User.findOne({email: req.user.email},
            'email status roles name email classes picture major minor verified groups',

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
    User.findById(req.user._id, function (err, user) {
        if (err) {
            console.log(err);
            return res.status(401).end('An error occurred while updating. Please try again later.');
        }

        user.status = userUpdate.status || user.status;
        if (user.status == userUpdate.status) {
            user.statusCreated = Date.now();
        }
        user.name = userUpdate.name || user.name;

        user.save(function (err) {
            if (err) return res.status(401).end('An error occurred. Please try again later.');
            return res.json({token: req.body.token});
        });
    });

};

exports.addReqUserToGroup = function (req, res) {
    if (!req.params.name) {
      return res.status(404).end('Group name required.');
    }

    Group.findOne({name: req.params.name}, function(err, group) {
        if (err) {
            console.log(err);
            return res.status(401).end('An unknown error occurred in adding user to group.');
        }
        if (group) {
            group.users.push(req.user._id);
            group.save(function(err) {
                if (err) {
                    console.log(err);
                    return res.status(401).end('An unknown error occurred in saving group users.');
                }

                req.user.groups.push(group._id);
                req.user.classes.push(group.name);

                req.user.save(function(err) {
                    if (err) {
                        console.log(err);
                        return res.status(401).end('An unknown error occurred in saving user.');
                    }
                    return res.json({token: req.token, group: group});
                });

            });
        } else {
            var groupUrl = req.params.name.replace(/\s+/g,'').toLowerCase();

            var newGroup = new Group({
                name: req.params.name,
                url: groupUrl,
                users: [req.user._id]
            });

            newGroup.save(function(err) {
                if (err) {
                    console.log(err);
                    return res.status(401).end('An unknown error occurred in saving group.');
                }
                req.user.groups.push(newGroup._id);
                req.user.classes.push(newGroup.name);
                req.user.save(function(err) {
                    if (err) {
                        console.log(err);
                        return res.status(401).end('An unknown error occurred in saving user.');
                    }
                    console.log("REQ USER SUCCESSFULLY ADDED TO GROUP ", newGroup, req.user);
                    return res.json({token: req.token, group: newGroup});
                });

            })
        }

    });

};

exports.removeReqUserFromGroup = function(req, res) {
    if (!req.params.groupId) {
        return res.status(404).end('Group ID required.');
    }
    Group.findById(mongoose.Types.ObjectId(req.params.groupId), function(err, group) {
        if (err) {
            console.log(err);
            return res.status(401).end('An unknown error occurred in removing user from group.');
        }
        console.log("GROUP USERS", group.users);
        group.users.splice(group.users.indexOf(req.user._id), 1);
        group.save(function(err) {
            if (err) {
                console.log(err);
                return res.status(401).end('An unknown error occurred in removing user from group.');
            }
            req.user.groups.splice(req.user.groups.indexOf(mongoose.Types.ObjectId(req.params.groupId)), 1);
            req.user.save(function(err) {
                if (err) {
                    console.log(err);
                    return res.status(401).end('An unknown error occurred in saving user.');
                }
                console.log("REQ USER SUCCESSFULLY REMOVED FROM GROUP", group, req.user);
                return res.json({token: req.token});
            });
        })
    });
};

exports.getCommentsForGroupPostId = function(req, res) {
    if (!req.params.groupPostId) {
        return res.status(404).end('GroupPost ID required.');
    }

    Comment.find({groupPostId: req.params.groupPostId}, function(err, comments) {
        if (err) {
            console.log(err);
            return res.status(401).end('An unknown error occurred in resolving comments.');
        }

        return res.json({token: req.token, comments: comments});
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

exports.verifyEmail = function (req, res, next) {
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
                var token = jwt.sign({email: user.email, _id: user._id}, secrets.jwt, {expiresInDays: 7});
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
            text: 'Thanks for signing up for twerk.io! Your verification code is: ' + user._id + '. Navigate to the following URL to verify your email account: http://www.twerk.io/verify/' + user._id
            + " (you may need to login again before trying the link). If the link doesn't work for you, try inputting the code manually on the verification page."
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