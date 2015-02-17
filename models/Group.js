var mongoose = require('mongoose');
var User = require('./User');

var groupSchema = new mongoose.Schema({
    createdAt: {type: Date, required: true, default: Date.now()},
    name: {type: String, required: true},
    url: {type: String, required: true},
    term: {type: String, default: 'Spring 2015', required: true},
    groupPosts: {type: [mongoose.Schema.Types.objectId], default: []},
    users: {type: [mongoose.Schema.Types.objectId], default: [], required: true}
});

module.exports = mongoose.model('Group', groupSchema);