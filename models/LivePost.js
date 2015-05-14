var mongoose = require('mongoose');

var livePostSchema = new mongoose.Schema({
    createdAt: {type: Date, default: Date.now, required: true},
    text: {type: String},
    location: {type: String, required: true},
    classes: {type: [String]},
    createdByName: {type: String, required: true},
    createdBy: {type: mongoose.Schema.ObjectId, required: true},
    numComments: {type: Number, required: true, default: 0}
});

module.exports = mongoose.model('LivePost', livePostSchema);
