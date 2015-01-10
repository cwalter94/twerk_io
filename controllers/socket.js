var Message = require('../models/Message');
var Room = require('../models/Room');
var User = require('../models/User');

exports.socketHandler = function(socket) {


    //initialize connection
    socket.on('init', function(user) {
        Room.find({users: user._id}, function(err, rooms) {
            if (err) socket.emit('error', 'An error occurred in finding rooms.');
            socket.emit('init', {rooms: rooms, user: user._id});
        })
    });


    // find rooms this user is part of
    socket.on("get:rooms", function(user) {
        console.log("socket get all rooms");
        console.log(user);

        Room.find({users: user._id}, function(err, rooms) {
            if (err) socket.emit('error', 'An error occurred in finding rooms.');
            socket.emit('userRooms', rooms);
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
        console.log(msg);
        if (msg.from && msg.to && msg.text) {
            var message = new Message({
                from: msg.from,
                to: msg.to,
                text: msg.text
            });
            message.save(function(err) {
                if (err) {
                    console.log(err);
                    socket.emit('error', 'An error occurred when saving this message');
                } else {
                    console.log(msg.to);
                    socket.broadcast.to('' + msg.to).emit("send:message", message);
                }

            })
        } else {
            socket.emit('error', 'An error occurred - required fields not met.');
        }
    });

    socket.on("disconnect", function() {

    });

};
