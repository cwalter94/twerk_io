var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secrets = require('../config/secrets');
var userSchema = new mongoose.Schema({
    email: { type: String, unique: true, lowercase: true},
    password: String,
    status: {type: String, default: ''},
    verified: {type: Boolean, default: false},
    roles: {type: Array, default: ['User']},
    lastOnline: {type: Date, default: Date.now, required: true},
    unreadRooms: {type: [mongoose.Schema.Types.objectId], default: []},
    expiredtokens: {type: Array, default: []},
    socket: {type: String, default: ''},
    testData: {type: Boolean, default: false},
    name: { type: String, default: '' },
    picture: { type: String, default: '' },
    major: {type: Array, default: []},
    minor: {type: Array, default: []},
    classes: {type: [String], default: []},
    phone: String,
    verificationCode: String,

    resetPasswordToken: String,
    resetPasswordExpires: Date
});

/**
 * Hash the password for security.
 * "Pre" is a Mongoose middleware that executes before each user.save() call.
 */

userSchema.pre('save', function (next) {
    var user = this;
    if (!user.isModified('password')) return next();

    bcrypt.genSalt(5, function (err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, null, function (err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});

/**
 * Validate user's password.
 * Used by Passport-Local Strategy for password validation.
 */

userSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) return cb(err);
        cb(isMatch);
    });
};
//
//userSchema.methods.verifytoken = function(token, cb) {
//    if (!this.expiredtokens.length) return cb(token);
//
//    for (var i = 0; i < this.expiredtokens.length; i++) {
//        var t = this.expiredtokens[i];
//        var profile = jwt.verify(t, secrets.jwt);
//
//        // if more than 1 days old, remove from stored expired tokens
//        if (profile.original_iat - new Date() > 1) { // iat == issued at
//            this.expiredtokens.splice(i, 1);
//            i--;
//        } else {
//            if (token == t) return cb(null)
//        }
//    }
//    return cb(token)
//};


module.exports = mongoose.model('User', userSchema);
