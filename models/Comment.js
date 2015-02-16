var mongoose = require('mongoose');
var User = require('./User');

var commentSchema = new mongoose.Schema({
    createdAt: {type: Date, default: Date.now, required: true},
    text: {type: String, required: true},
    updatedAt: {type: Date},
    createdBy: {type: mongoose.Schema.Types.ObjectId, required: true},
    groupPost: {type: mongoose.Schema.Types.ObjectId},
    replyTo: {type: mongoose.Schema.Types.ObjectId}
});

module.exports = mongoose.model('Comment', commentSchema);
