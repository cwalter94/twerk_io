var mongoose = require('mongoose');

var messageSchema = new mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, required: true},
    to: {type: mongoose.Schema.Types.ObjectId, required: true},
    createdAt: {type: Date, default: Date.now},
    text: {type: String, required: true},
    fromSocket: {type: String, default: ''},
    toSocket: {type: String, default: ''},
    read: {type: Boolean, default: false}

});

module.exports = mongoose.model('Message', messageSchema);
