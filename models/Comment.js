var mongoose = require('mongoose');
var User = require('./User');

var commentSchema = new mongoose.Schema({
    createdAt: {type: Date, default: Date.now, required: true},
    text: {type: String, required: true},
    updatedAt: {type: Date},
    createdBy: {type: mongoose.Schema.Types.ObjectId, required: true},
    groupPostId: {type: mongoose.Schema.Types.ObjectId, required: true},
    groupId: {type: mongoose.Schema.Types.ObjectId, required: true},
    children: {type: [mongoose.Schema.Types.ObjectId]},
    parentId: {type: mongoose.Schema.Types.ObjectId, required: true},
    likes: {type: Number, default: 0, required: true},
    dislikes: {type: Number, default: 0, required: true}

});

module.exports = mongoose.model('Comment', commentSchema);
