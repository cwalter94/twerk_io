var Message = require('../models/Message');
var Room = require('../models/Room');
var User = require('../models/User');

var allUsers = {};

exports.socketHandler = function(socket) {

    socket.on('user:init', function(email) {
        socket.email = email;
        allUsers[email] = {online : true};
        socket.emit('user:init', allUsers);
        socket.broadcast.emit('user:online', email);

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
        if (msg.from && msg.to && msg.text !== '') {
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

        allUsers[socket.email] = {online : false};
        var temp = [];
        socket.broadcast.emit('user:offline', socket.email);
    });

};
