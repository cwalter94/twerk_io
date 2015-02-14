var mongoose = require('mongoose');
var User = require('./User');

var groupPostSchema = new mongoose.Schema({
    createdAt: {type: Date, default: Date.now, required: true},
    text: {type: String, required: true},
    updatedAt: {type: Date},
    createdBy: {type: mongoose.Schema.Types.ObjectId, required: true},
    comments: [mongoose.Schema.Types.objectId]
});

module.exports = mongoose.model('GroupPost', groupPostSchema);
