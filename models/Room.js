var mongoose = require('mongoose');
var User = require('./User');

var roomSchema = new mongoose.Schema({
    messages: {type: [mongoose.Schema.Types.objectId], default: []},
    users: {type: [mongoose.Schema.Types.objectId], required: true},
    title: {type: String, default: 'Default'},
    usersLength: {type: Number, default: 0},
    messagesLength: {type: Number, default: 0},
    created: {type: Date, default: Date.now, required: true},
    lastMessage: {type: String, default: ''},
    usersNames: {type: [String], default:''},
    lastMessageCreated: {type: Date, default: Date.now, required: true}
});

roomSchema.pre('save', function (next) {
    var room = this;
    if (!room.isModified('users') && !room.isModified('messages')) return next();
    if (room.isModified('users')) {
        room.usersLength = room.users.length;

    }
    if (room.isModified('messages')) {
        room.messagesLength = room.messages.length;
    }
    return next();
});

module.exports = mongoose.model('Room', roomSchema);
