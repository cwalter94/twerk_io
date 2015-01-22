var Message = require('../models/Message');
var Room = require('../models/Room');
var User = require('../models/User');
var mongoose = require('mongoose');

exports.socketHandler = function (allUsers) {
    return function (socket) {

        socket.on('user:init', function(userId) {
            socket.userId = userId;
            allUsers[userId] = {online : true, lastOnline: Date.now()};
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
                                socket.broadcast.emit('user:online', userId);

                            }
                        })
                    }

                }

            })

        });

        socket.on('join:room:arr', function(roomIds) {
            for(var r in roomIds) {
                socket.join('' + roomIds[r]);
            }
        });

        socket.on('set:current:room', function(roomId) {
            if (roomId != null) {
                Room.findById(mongoose.Types.ObjectId(roomId), 'unreadMessages', function(err, room) {
                    if (err) {
                        console.log(err);
                        socket.emit('error', 'An error occurred when saving this message');
                    } else if (room) {
                        room.unreadMessages[socket.userId] = 0;
                        room.save(function(err) {
                            if (err) {
                                console.log(err);
                                socket.emit('error', 'Room unread messages could not be updated.');
                            }
                        });
                    } else {
                        console.log('no room found');
                    }
                });
            }

            socket.currRoomId = roomId;
        });


        socket.on("join:room", function(roomId) {
            Room.findById(mongoose.Types.ObjectId(roomId), 'unreadMessages', function(err, room) {
                if (err) {
                    console.log(err);
                    socket.emit('error', 'An error occurred when saving this message');
                } else if (room) {
                    room.unreadMessages[socket.userId] = 0;
                    room.save(function(err) {
                        if (err) {
                            console.log(err);
                            socket.emit('error', 'Room unread messages could not be updated.');
                        }
                    });
                } else {
                    console.log('no room found');
                }
            });

            socket.join(roomId);
            socket.currRoomId = roomId;
            socket.emit('join:room', roomId);
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
                        Room.findById(mongoose.Types.ObjectId(msg.to), 'messages unreadMessages', function(err, room) {
                            if (err) {
                                console.log(err);
                                socket.emit('error', 'An error occurred when saving this message');
                            } else if (room) {
                                room.messages.push(message._id);
                                room.lastMessage = message.text;
                                if (socket.currRoomId !== msg.to) {
                                    room.unreadMessages[socket.userId] == null ? room.unreadMessages[socket.userId] = 1 : room.unreadMessages[socket.userId] += 1;
                                }
                                room.save(function(err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        socket.broadcast.to('' + msg.to).emit("send:message", message);
                                    }

                                });
                            } else {
                                console.log('no room found');
                            }
                        });
                    }
                });

            } else {
                socket.emit('error', 'An error occurred - required fields not met.');
            }
        });

        socket.on("disconnect", function() {

            allUsers[socket.userId] = {online : false, lastOnline: Date.now()};
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
