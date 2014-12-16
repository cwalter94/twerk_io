var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var User = require('../models/User');
var secrets = require('../config/secrets');
var multiparty = require('multiparty');

var uuid = require('uuid');
var fs = require('fs');
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

/**
 * POST /login
 * Sign in using email and password.
 * @param email
 * @param password
 * @param role
 */

exports.postLogin = function (req, res, next) {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('password', 'Password cannot be blank').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/login');
    }

    passport.authenticate('local', function (err, user, info) {
        if (err) return next(err);
        if (!user) {
            req.flash('errors', { msg: info.message });
            return res.redirect('/login');
        }
        req.logIn(user, function (err) {
            if (err) return next(err);
            req.flash('success', { msg: 'Success! You are logged in.' });
            res.redirect('/account');
        });
    })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */

exports.logout = function (req, res) {
    req.logout();
    res.redirect('/');
};

/**
 * GET /signup
 * Signup page.
 */

exports.getSignup = function (req, res) {
    if (req.user) return res.redirect('/');
    res.render('account/signup', {
        title: 'Create Account'
    });
};

/**
 * POST /signup
 * Create a new local account.
 * @param email
 * @param password
 * @param role
 */

exports.postSignup = function (req, res, next) {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('password', 'Password must be at least 4 characters long').len(4);
    req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/signup');
    }

    var excomm = false;
    if (req.body.excomm) {
        excomm = true;
    }

    var user = new User({
        email: req.body.email,
        password: req.body.password,
        excomm: excomm,
        role: req.body.role
    });

    User.findOne({ email: req.body.email }, function (err, existingUser) {
        if (existingUser) {
            req.flash('errors', { msg: 'Account with that email address already exists.' });
            return res.redirect('/signup');
        }
        user.save(function (err) {
            if (err) return next(err);
            req.logIn(user, function (err) {
                if (err) return next(err);
                res.redirect('/');
            });
        });
    });
};


exports.getAccount = function (req, res) {
    res.render('account/profile', {
        title: 'Account Management'
    });
};


/**
 * GET /account
 * Profile page.
 */

exports.getAccount = function (req, res) {
    res.render('account/profile', {
        title: 'Account Management'
    });
};

/**
 * POST /account/profile
 * Update profile information.
 */

exports.postUpdateProfile = function (req, res, next) {
    console.log(req.user);
    User.findById(req.user.id, function (err, user) {
        if (err) return next(err);
        user.excomm = req.body.excomm;
        user.email = req.body.email || '';
        user.profile.name = req.body.name || 'Unknown';
        user.profile.gender = req.body.gender || '';
        user.profile.location = req.body.location || '';
        user.profile.website = req.body.website || '';
        user.profile.address = req.body.address || '';
        user.role = req.body.role || '';
        if (user.excomm) {
            user.excommPosition = req.body.excommPosition.toString().toLowerCase().replace(/\s+/g, '');
        } else {
            user.excommPosition = "";
        }


        user.save(function (err) {
            if (err) return next(err);
            req.flash('success', { msg: 'Profile information updated.'});
            res.redirect('/account');
        });
    });
};

/**
 * POST /admin/account/profile
 * Update profile information.
 */

exports.postAdminUpdateProfile = function (req, res, next) {

    User.findById(req.user.id, function (err, user) {
        if (err) return next(err);
        console.log(user);
        if (user.role == 'Webmaster') {
            console.log(req.body);

            User.findOne({email: req.body.email}, 'email excomm role profile', function (err, user) {
                if (err || user == null) return next(err);
                console.log(user);
                user.profile.name = req.body.name;
                user.excomm = true;
                user.save(function (err) {
                    if (err) return next(err);
                    res.json({ success: true, msg: 'Profile information updated.'});
                    return;
                });
            });


        } else {
            res.json({success: false, msg: 'Authorization failed.'});
            return next();
        }

    });
};

/**
 * POST /account/picture
 */
exports.postProfilePicture = function (req, res, next) {
    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {

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
                    return res.json({success: true, msg: 'Profile picture updated.', picture: destPath.substring(6)});
                });
            });


        });


    });
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
 * POST /account/password
 * Update current password.
 * @param password
 */

exports.postUpdatePassword = function (req, res, next) {
    req.assert('password', 'Password must be at least 4 characters long').len(4);
    req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/account');
    }

    User.findById(req.user.id, function (err, user) {
        if (err) return next(err);

        user.password = req.body.password;

        user.save(function (err) {
            if (err) return next(err);
            req.flash('success', { msg: 'Password has been changed.' });
            res.redirect('/account');
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
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 * @param provider
 */

exports.getOauthUnlink = function (req, res, next) {
    var provider = req.params.provider;
    User.findById(req.user.id, function (err, user) {
        if (err) return next(err);

        user[provider] = undefined;
        user.tokens = _.reject(user.tokens, function (token) {
            return token.kind === provider;
        });

        user.save(function (err) {
            if (err) return next(err);
            req.flash('info', { msg: provider + ' account has been unlinked.' });
            res.redirect('/account');
        });
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
