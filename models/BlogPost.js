var mongoose = require('mongoose');

var blogPostSchema = new mongoose.Schema({
    author: { type: String, default: 'DU California Historian'},
    updated: {type: Date, default: Date.now},
    written: {type: Date, default: Date.now},
    title: {type: String, default: ''},
    text: {type: String, default:''},
    pictures: [String],
    comments: [mongoose.Schema.Types.ObjectId],
    draft: {type: Boolean, default: true}
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
