var mongoose = require('mongoose');
var User = require('./User');

var groupPostSchema = new mongoose.Schema({
    groupId: {type: mongoose.Schema.ObjectId, required: true},
    createdAt: {type: Date, default: Date.now, required: true},
    text: {type: String, required: true},
    updatedAt: {type: Date},
    createdBy: {type: mongoose.Schema.ObjectId, required: true},
    comments: {type: [mongoose.Schema.Types.objectId], default: []}
});

module.exports = mongoose.model('GroupPost', groupPostSchema);
