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

            })

        });

        //
        //socket.on("typing", function(data) {
        //    if (typeof people[socket.id] !== "undefined")
        //        io.sockets.in(socket.room).emit("isTyping", {isTyping: data, person: people[socket.id].name});
        //});

        socket.on("join:room", function(room) {
            socket.join(room);
            socket.emit('join:room', room);
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
                        Room.findById(mongoose.Types.ObjectId(msg.to), 'messages', function(err, room) {
                            if (err) {
                                console.log(err);
                                socket.emit('error', 'An error occurred when saving this message');
                            } else if (room) {
                                room.messages.push(message._id);
                                room.lastMessage = message.text;

                                room.save(function(err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        socket.broadcast.to('' + msg.to).emit("send:message", message);
                                        if (allUsers[msg.toEmail] && allUsers[msg.toEmail].online) {
                                            socket.broadcast.to('' + msg.toEmail).emit("new:message");
                                        }
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

            var temp = [];
            socket.broadcast.emit('user:offline', socket.userId);
        });

    }
};
