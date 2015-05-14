var Message = require('../models/Message');
var Room = require('../models/Room');
var User = require('../models/User');
var LivePost = require('../models/LivePost');
var Group = require('../models/Group');
var Comment = require('../models/Comment');
var mongoose = require('mongoose');

exports.socketHandler = function (allUsers) {
    return function (socket) {

        socket.on('user:init', function(userId) {
            socket.userId = userId;
            allUsers[userId] = {online : true, lastOnline: Date.now(), currRoomId: null};
            socket.emit('user:init', allUsers);
            socket.join(userId);
            User.findById(userId, 'lastOnline', function(err, user) {
                if (err) {
                    console.log(err);
                    socket.emit('error', err);
                } else {
                    if (user) {
                        user.lastOnline = Date.now();
                        user.save(function(err) {
                            if (err) {
                                console.log(err);
                                socket.emit('error', err);
                            } else {

                                Group.find({users: user._id}, function(err, groups) {
                                    for (var i = 0; i < groups.length; i++) {
                                        socket.join(groups[i]._id);
                                        console.log("User " + user._id + " joined socket for group " + groups[i]._id);
                                    }
                                    socket.broadcast.emit('user:online', userId);
                                });

                            }
                        })
                    }

                }

            });

        });

        socket.on('join:room:arr', function(roomIds) {
            for(var r in roomIds) {
                socket.join(roomIds[r]);
            }
        });

        socket.on('set:current:room', function(data) {
            var roomId = data.roomId;
            var userId = data.userId;

            if (roomId != '') {
                Room.findById(mongoose.Types.ObjectId(roomId), 'unreadMessages users', function(err, room) {
                    if (err) {
                        console.log(err);
                        socket.emit('error', 'An error occurred when saving this message');
                    } else if (room) {

                        var newArr = [];

                        for (var i = 0; i < room.unreadMessages.length; i++) {
                            var m = room.unreadMessages[i];
                            if (m.indexOf(socket.userId) > -1) {
                                newArr.push(m.substring(0, m.lastIndexOf('.'))+ '.0');

                            } else {
                                newArr.push(m);
                            }
                        }

                        if (newArr.length > 0) {
                            room.unreadMessages = newArr;
                            room.save(function(err) {
                                if (err) {
                                    console.log(err);
                                    socket.emit('error', 'Room unread messages could not be updated.');
                                }
                            });
                        }


                    } else {
                        console.log('no room found');
                    }
                });
            }

            allUsers[userId] != null ? allUsers[userId].currRoomId = roomId : allUsers[userId] = {online: false, lastOnline: null, currRoomId: null};
        });

        socket.on('new:room', function(data) {
            var roomId = data.roomId;
            var userId = data.userId;
            socket.join(roomId);
            socket.broadcast.to('' + userId).emit('new:room', roomId);
        });

        socket.on("send:message", function(msg) {
            if (msg.from && msg.to && msg.toEmail && msg.text !== '') {
                var message = new Message({
                    from: mongoose.Types.ObjectId(msg.from),
                    to: mongoose.Types.ObjectId(msg.to),
                    text: msg.text
                });

                message.save(function(err) {
                    if (err) {
                        console.log(err);
                        socket.emit('error', 'An error occurred when saving this message');
                    } else {
                        Room.findById(mongoose.Types.ObjectId(msg.to), 'messages unreadMessages users', function (err, room) {
                            if (err) {
                                console.log(err);
                                socket.emit('error', 'An error occurred when saving this message');
                            } else if (room) {
                                var userId;

                                for (var u = 0; u < room.users.length; u++) {
                                    if (room.users[u] != socket.userId) {
                                        userId = room.users[u];
                                        break;
                                    }
                                }
                                room.messages.push(message._id);
                                room.lastMessage = message.text;
                                var newArr = [];

                                if (!allUsers[userId] || allUsers[userId].currRoomId == null || allUsers[userId].currRoomId != msg.to) {
                                    for (var i = 0; i < room.unreadMessages.length; i++) {
                                        if (room.unreadMessages[i].indexOf('' + socket.userId) == -1) {
                                            var index = room.unreadMessages[i].lastIndexOf('.') + 1;
                                            var temp = Number(room.unreadMessages[i].substring(index));
                                            temp += 1;

                                            newArr.push(room.unreadMessages[i].substring(0, index) + temp);

                                        } else {
                                            newArr.push(room.unreadMessages[i]);
                                        }
                                    }

                                    room.unreadMessages = newArr;
                                    room.save(function (err) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            return socket.broadcast.to(msg.to).emit("send:message", message);
                                        }
                                    });
                                } else if (allUsers[userId].currRoomId == msg.to) {
                                    return socket.broadcast.to(msg.to).emit("send:message", message);
                                } else {
                                    console.log('no room found');
                                }



                            }
                        });
                    }
                });

            } else {
                socket.emit('error', 'An error occurred - required fields not met.');
            }
        });

        socket.on('update:status', function(data) {
            socket.broadcast.emit('update:status', data);
        });

        socket.on('new:livePost', function(livePost) {
            var newPost = new LivePost(livePost);
            newPost.save(function(err) {
                if (err) {
                    socket.emit('error', err);
                    console.log(err);
                } else {
                    socket.broadcast.emit('new:livePost', newPost);
                    socket.emit('new:livePost', newPost);
                }
            });
        });

        socket.on('new:comment', function(comment) {
            var newComment = new Comment(comment);

            newComment.save(function(err) {
                if (err) {
                    socket.emit('error', err);
                    console.log(err);
                } else {
                    socket.broadcast.to(newComment.groupId).emit('new:comment', newComment);
                    socket.emit('new:comment', newComment);
                }
            });
        });

        socket.on("disconnect", function() {

            allUsers[socket.userId] = {online : false, lastOnline: Date.now(), currRoomId: null};
            socket.broadcast.emit('user:offline', socket.userId);

            User.findById(socket.userId, function(err, user) {
               if (err) {
                   console.log(err);
                   socket.emit('error', err);
               } else if (user) {
                   user.lastOnline = Date.now();
                   user.save(function(err) {
                       if (err) {
                           console.log(err);
                       }
                   });
               } else {
                   console.log("disconnected user not found");
               }
            });


        });

    }
};
