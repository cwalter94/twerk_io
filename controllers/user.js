var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var User = require('../models/User');
var secrets = require('../config/secrets');
var multiparty = require('multiparty');
var jwt = require('jsonwebtoken');
var uuid = require('uuid');
var fs = require('fs');
var UnauthorizedError = require('express-jwt/lib/errors/UnauthorizedError');

/**
 * GET /login
 * Login page.
 */

exports.getLogin = function (req, res) {
    if (req.user) return res.redirect('/');
    res.render('account/login', {
        title: 'Login'
    });
};

exports.validateToken = function(req, res, next) {


    if (!req.headers.authorization || (req.headers.authorization && !req.headers.authorization.length)) {
        return res.status(401).end('User is not authorized.');

    }

    var token = req.headers.authorization.split(' ')[1];

    try {
        jwt.verify(token, secrets.jwt, {}, function(err, decoded) {
            if (err) {
                return res.status(401).end();
                //return next(new UnauthorizedError('invalid_token', err));
            }
            if (decoded) {
                User.findOne({email: decoded.email}, function (err, user) {

                    if (err) {
                        console.log(err);
                        return res.status(401).end('Error with user email.');
                    }


                for (var i = 0; i < user.expiredtokens.length; i++) {
                    var expiredtoken = user.expiredtokens[i];

                    if (typeof expiredtoken === Object) {
                        if (token === expiredtoken.t) return next(new UnauthorizedError('invalid_token',  { message: 'This token is expired.' }));

                        // if more than 8 days old (diff in milliseconds), remove from stored expired tokens
                        if ((Math.floor((new Date())/1000) - expiredtoken.issued_at) > 192*1000*3600) {
                            user.expiredtokens.splice(i, 1);
                            i--;
                        }
                    } else {
                        // if expiredtoken isn't an object (created before objects were necessary to track dates (jwt won't decode token if it's expired))
                        // assign new expiredtoken object with date to one day ago
                        user.expiredtokens[i] = {token: expiredtoken, issued_at: Math.floor((new Date())/1000) - (1*24*3600)};

                        if (token === user.expiredtokens[i].token) return next(new UnauthorizedError('invalid_token',  { message: 'This token is expired.' }));
                    }

                }

                    if ((Math.floor((new Date())/1000) - decoded.iat) > 1*1000*3600) { // if token age > 1 hour
                        user.expiredtokens.push({token: token, issued_at: decoded.iat});
                        req['user'] = user;
                        var newtoken = jwt.sign({email: decoded.email, name: decoded.name, roles: decoded.roles, verified: decoded.verified}, secrets.jwt, { expiresInDays: 7});
                        req['token'] = newtoken;
                        return next();
                    }

                    req['user'] = user;
                    req['token'] = token;
                    return next();

                });
            }

        });

    } catch(err) {
        res.send(401);
        return next(new UnauthorizedError('invalid_token',  { message: 'Token is expired. Login required.' }));
    }
};


/**
 * POST /admin/account/picture
 */
exports.postAdminProfilePicture = function (req, res, next) {
    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        User.findById(req.user.id, function (err, user) {
            if (err) return next(err);
            if (user.role == 'Webmaster') {

                var file = files.file[0];
                var contentType = file.headers['content-type'];
                var tmpPath = file.path;
                var extIndex = tmpPath.lastIndexOf('.');
                var extension = (extIndex < 0) ? '' : tmpPath.substr(extIndex);
                // uuid is for generating unique filenames.
                var fileName = uuid.v4() + extension;
                var destPath = 'public/img/members/' + fileName;

                // Server side file type checker.
                if (contentType !== 'image/png' && contentType !== 'image/jpeg') {
                    fs.unlink(tmpPath);
                    return res.status(400).send('Unsupported file type.');
                }

                fs.rename(tmpPath, destPath, function (err) {
                    if (err) {
                        return res.status(400).send('Image is not saved:');
                    }

                    User.findOne({excommPosition: req.headers.filerole}, 'email excommPosition profile', function (err, user) {
                        if (err || user == null) return next(err);
                        user.profile.picture = destPath.substring(6);
                        user.save(function (err) {
                            if (err) return next(err);
                            return res.json({picture: destPath.substring(6)});
                        });
                    });


                });

            } else {
                res.json({success: true, msg: 'Authorization failed.'});
            }
        });

    });
};


/**
 * POST /account/delete
 * Delete user account.
 */

exports.postDeleteAccount = function (req, res, next) {
    User.remove({ _id: req.user.id }, function (err) {
        if (err) return next(err);
        req.logout();
        req.flash('info', { msg: 'Your account has been deleted.' });
        res.redirect('/');
    });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */

exports.getReset = function (req, res) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    User
        .findOne({ resetPasswordToken: req.params.token })
        .where('resetPasswordExpires').gt(Date.now())
        .exec(function (err, user) {
            if (!user) {
                req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
                return res.redirect('/forgot');
            }
            res.render('account/reset', {
                title: 'Password Reset'
            });
        });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 * @param token
 */

exports.postReset = function (req, res, next) {
    req.assert('password', 'Password must be at least 4 characters long.').len(4);
    req.assert('confirm', 'Passwords must match.').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('back');
    }

    async.waterfall([
        function (done) {
            User
                .findOne({ resetPasswordToken: req.params.token })
                .where('resetPasswordExpires').gt(Date.now())
                .exec(function (err, user) {
                    if (!user) {
                        req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
                        return res.redirect('back');
                    }

                    user.password = req.body.password;
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;

                    user.save(function (err) {
                        if (err) return next(err);
                        req.logIn(user, function (err) {
                            done(err, user);
                        });
                    });
                });
        },
        function (user, done) {
            var transporter = nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: secrets.sendgrid.user,
                    pass: secrets.sendgrid.password
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'hackathon@starter.com',
                subject: 'Your Hackathon Starter password has been changed',
                text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            transporter.sendMail(mailOptions, function (err) {
                req.flash('success', { msg: 'Success! Your password has been changed.' });
                done(err);
            });
        }
    ], function (err) {
        if (err) return next(err);
        res.redirect('/');
    });
};

/**
 * GET /forgot
 * Forgot Password page.
 */

exports.getForgot = function (req, res) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.render('account/forgot', {
        title: 'Forgot Password'
    });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 * @param email
 */

exports.postForgot = function (req, res, next) {
    req.assert('email', 'Please enter a valid email address.').isEmail();

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/forgot');
    }

    async.waterfall([
        function (done) {
            crypto.randomBytes(16, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            User.findOne({ email: req.body.email.toLowerCase() }, function (err, user) {
                if (!user) {
                    req.flash('errors', { msg: 'No account with that email address exists.' });
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },
        function (token, user, done) {
            var transporter = nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: secrets.sendgrid.user,
                    pass: secrets.sendgrid.password
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'hackathon@starter.com',
                subject: 'Reset your password on Hackathon Starter',
                text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            transporter.sendMail(mailOptions, function (err) {
                req.flash('info', { msg: 'An e-mail has been sent to ' + user.email + ' with further instructions.' });
                done(err, 'done');
            });
        }
    ], function (err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
};
