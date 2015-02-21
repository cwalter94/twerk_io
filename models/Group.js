var mongoose = require('mongoose');
var User = require('./User');

var groupSchema = new mongoose.Schema({
    createdAt: {type: Date, required: true, default: Date.now()},
    name: {type: String, required: true},
    url: {type: String, required: true},
    term: {type: String, default: 'Spring 2015'},
    users: {type: [mongoose.Schema.Types.objectId]}
});

module.exports = mongoose.model('Group', groupSchema);
