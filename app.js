/**
 * Module dependencies.
 */

var express = require('express');
var cookieparser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyparser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var csrf = require('lusca').csrf();
var methodOverride = require('method-override');
var _ = require('lodash');
var flash = require('express-flash');
var path = require('path');
var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');
var User = require('./models/User');
var request = require('request');
var berkeleyAppId = "2e2a3e6e";
var berkeleyKey = "2c132785f8434f0e6b3a49c28895645f";
var emailUrl = "http://www.twerk.io/?from=admin@twerk.io";
var Mailgun = require('mailgun-js');
var mailgunKey = "key-3fd41b1df6301ef53382901f944d28a5";
var mailgunUrl = "twerk.io";
var mailgunPubKey = "pubkey-61659c85d07e91b13398effbb8f3f476";
/**
 * Controllers (route handlers).
 */

var loginController = require('./controllers/login');

var accountSid = 'AC5fda92712e1b88c02edd825fce4ce15c';
var authToken = "5f67a5da30d9e943f593e1a31839b38f";
var client = require('twilio')(accountSid, authToken);
var parse = require("Parse").Parse;
var parseStrategy = require('passport-parse');


/**
 * API keys and Passport configuration.
 */

var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

var app = express();
//

//


parse.initialize("wrYfl1BbtGto9UYCecx305xHeZu6ycf8TOz1cce5", "JJZIYfKZvDi6Ene8YeiscLEqnzYrtZt2jaBBX4Tn", "ntAz47qeSXl7DGrFiSbhIRWeal6SIXhlW1WHHIuQ");
var parseStrategy = new parseStrategy({parseClient: parse});

/**
 * Create Express server.
 */


//
///**
// * Connect to MongoDB.
// */
//
var hour = 3600000;
var day = hour * 24;
var week = day * 7;

/**
 * CSRF whitelist.
 */

var csrfExclude = ['/url1', '/url2'];

/**
 * Express configuration.
 */

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


app.use(compress());
app.use(connectAssets({
  paths: [path.join(__dirname, 'public/css'), path.join(__dirname, 'public/js')],
  helperContext: app.locals
}));
app.use(logger('dev'));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(methodOverride());

app.use(cookieparser());
//

passport.use(parseStrategy);
app.use(passport.initialize());

app.use(passport.session());

app.use(flash());

app.use(session({
    secret: secrets.sessionSecret,
    key: 'sid',
    cookie: {secure: false}
}))
app.use(function(req, res, next) {
  // CSRF protection.
  if (_.contains(csrfExclude, req.path)) return next();
  csrf(req, res, next);
});
app.use(function(req, res, next) {
  // Make user object available in templates.
  res.locals.user = req.user;
  next();
});
app.use(function(req, res, next) {
  // Remember original destination before login.
  var path = req.path.split('/')[1];
  if (/auth|login|logout|signup|fonts|favicon/i.test(path)) {
    return next();
  }
  req.session.returnTo = req.path;
  next();
});
app.use(express.static(path.join(__dirname, '/public'), { maxAge: week }));

/**
 * Main routes.
 */

app.post('/api/login', loginController.login);

app.post('/api/register', function(req, res, next) {

    var mailgun = new Mailgun({apiKey: mailgunKey, domain: mailgunUrl});
    var user = new parse.User();

    var code = genCode();
    var data = req.body;

    user.set("username", data.email);
    user.set("password", data.password);
    user.set("email", data.email);
    user.set("phone", data.phone || "");
    user.set("verCode", code);
    user.set("verified", false);

    user.signUp(null, {
        success: function(result) {
            console.log(result);
            var emaildata = {
                //Specify email data
                from: 'admin@twerk.io',
                //The email to contact
                to: data.email,
                //Subject and text data
                subject: 'Twerk.io Verification Code: ' + code,
                text: 'Keep twerking hard! Copy the verification code into your web browser to verify this email address.'
            };

            mailgun.messages().send(emaildata, function (err, body) {
                //If there is an error, render the error page
                if (err) {
                    console.log("got an error: ", err);
                    res.json({success: false, data: {}, error: err});
                    return;
                }
                //Else we can greet    and leave
                else {
                    res.json({success: true, data: {}, error: null});
                    return;
                }
            });
        },
        error: function(result, error) {
            console.log(error);
            res.json({
                success: false,
                data: result,
                error: error
            });
            return;
        }
    });


    function genCode() {
        var i, possible, text;
        text = "";
        possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        i = 0;
        while (i < 5) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
            i++;
        }
        return text;
    }




});


app.get('/partials/outer/:name', function(req, res) {
    console.log("outer");
    res.render('partials/outerState/' + req.params.name);
});

app.get('/partials/inner/:dir/:name', function(req, res) {
    console.log("inner");
    console.log(req.params.dir);
    res.render('partials/innerState/' + req.params.dir + '/' + req.params.name);
});

app.get('/api/verify/phone', function(req, res) {

});

app.get('/api/verify/emailcode', function(req, res) {


    if (parse.User.current()) {
        // We need to fetch because we need to show fields on the user object.
        parse.User.current().fetch().then(function(user) {
                // Render the user profile information (e.g. email, phone, etc).
                var code = req.query.code;
                console.log(JSON.stringify(user));
                if (user.verCode == code) {
                    user.set("emailVerified", true);
                    user.set("verified", true);
                    user.save(null, {
                        success: function(result) {
                            console.log("verify success");
                        },
                        error: function(result, error) {
                            console.log("verify failure.");
                            console.log(error);
                        }
                    });
                }

            },
            function(error) {
                // Render error page.
            });
    } else {
        // User not logged in, redirect to login form.
        res.redirect('/login');
    }


});

app.get('/api/verify/email', function(req, res) {
    var query = new parse.Query("User");
    var username = req.query.email;

    query.find(null, {
        success: function(users) {
            if (users.length > 0) {
                console.log("user already exists");
                res.json({success: true, data: {
                    registered: true
                    }
                });
            } else {
                res.json({success: true, data: {
                    registered: false
                }});
            }

        },
        error: function(result) {
            console.log("error in checking user");
            res.json({success: false});
        }
    });

});

app.post('/api/request', function(req, res) {

    var data = req.body;
    var user = parse.User.current();
    console.log(JSON.stringify(user));
    var request = parse.Object.extend("request");
    request = new request();

    request.set("name", data.name);
    request.set("phone", user.phone);
    request.set("email", user.email);
    request.set("supplement1", data.supplement1);
    request.set("supplement2", data.supplement2);

    request.save(null, {
        success: function(result) {
            res.json({
                success: true,
                data: result,
                error: null
            });
        },
        error: function(result, error) {
            res.json({
                success: false,
                data: result,
                error: error
            });
        }
    });
});


app.get("/*", function(req, res) {
    console.log("something else");
    res.render('index');
});


//
//app.get('/', homeController.index);
//app.get('/login', userController.getLogin);
//app.post('/login', userController.postLogin);
//app.get('/logout', userController.logout);
//app.get('/forgot', userController.getForgot);
//app.post('/forgot', userController.postForgot);
//app.get('/reset/:token', userController.getReset);
//app.post('/reset/:token', userController.postReset);
//app.get('/signup', userController.getSignup);
//app.post('/signup', userController.postSignup);
//app.get('/contact', contactController.getContact);
//app.post('/contact', contactController.postContact);
//app.get('/account', passportConf.isAuthenticated, userController.getAccount);
//
//app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
//app.post('/account/picture', passportConf.isAuthenticated, userController.postProfilePicture);
//app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
//app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
//app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);
//app.get('/blog', blogController.index);
//app.get('/blog/posts', blogController.getPosts);
//app.get('/blog/new', blogController.isAuthenticated, blogController.getNewBlogPost);
//app.post('/blog/new', blogController.isAuthenticated, blogController.postNewBlogPost);
//app.post('/blog/picture', blogController.isAuthenticated, blogController.postBlogPicture);
//
//app.post('/admin/account/profile', passportConf.isAuthenticated, userController.postAdminUpdateProfile);
//app.post('/admin/account/picture', passportConf.isAuthenticated, userController.postAdminProfilePicture);
//
//
//
//app.get('/alumni/verify/partials/:name', function(req, res) {
//    res.render('alumni/verify/partials/' + req.params.name);
//});
//
//app.get('/alumni', alumniController.index);
//app.get('/alumni/*', alumniController.index);
//
////
////app.get('/scholarship', function(req, res) {
////    res.render('index');
////});
////app.get('/scholarship/*', scholarshipController.index);
//
//
///**
// * API examples routes.
// */
//
//app.get('/api', apiController.getApi);
//app.get('/api/lastfm', apiController.getLastfm);
//app.get('/api/nyt', apiController.getNewYorkTimes);
//app.get('/api/aviary', apiController.getAviary);
//app.get('/api/steam', apiController.getSteam);
//app.get('/api/stripe', apiController.getStripe);
//app.post('/api/stripe', apiController.postStripe);
//app.get('/api/scraping', apiController.getScraping);
//app.get('/api/twilio', apiController.getTwilio);
//app.post('/api/twilio', apiController.postTwilio);
//app.get('/api/clockwork', apiController.getClockwork);
//app.post('/api/clockwork', apiController.postClockwork);
//app.get('/api/foursquare', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFoursquare);
//app.get('/api/tumblr', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTumblr);
//app.get('/api/facebook', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFacebook);
//app.get('/api/github', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getGithub);
//app.get('/api/twitter', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTwitter);
//app.post('/api/twitter', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.postTwitter);
//app.get('/api/venmo', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getVenmo);
//app.post('/api/venmo', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.postVenmo);
//app.get('/api/linkedin', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getLinkedin);
//app.get('/api/instagram', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getInstagram);
//app.get('/api/yahoo', apiController.getYahoo);
//
///**
// * OAuth sign-in routes.
// */
//
//app.get('/auth/instagram', passport.authenticate('instagram'));
//app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), function(req, res) {
//  res.redirect(req.session.returnTo || '/');
//});
//app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
//app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
//  res.redirect(req.session.returnTo || '/');
//});
//app.get('/auth/github', passport.authenticate('github'));
//app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) {
//  res.redirect(req.session.returnTo || '/');
//});
//app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
//app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
//  res.redirect(req.session.returnTo || '/');
//});
//app.get('/auth/twitter', passport.authenticate('twitter'));
//app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), function(req, res) {
//  res.redirect(req.session.returnTo || '/');
//});
//app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
//app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), function(req, res) {
//  res.redirect(req.session.returnTo || '/');
//});
//
///**
// * OAuth authorization routes for API examples.
// */
//
//app.get('/auth/foursquare', passport.authorize('foursquare'));
//app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), function(req, res) {
//  res.redirect('/api/foursquare');
//});
//app.get('/auth/tumblr', passport.authorize('tumblr'));
//app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), function(req, res) {
//  res.redirect('/api/tumblr');
//});
//app.get('/auth/venmo', passport.authorize('venmo', { scope: 'make_payments access_profile access_balance access_email access_phone' }));
//app.get('/auth/venmo/callback', passport.authorize('venmo', { failureRedirect: '/api' }), function(req, res) {
//  res.redirect('/api/venmo');
//});
//

//app.get("*", homeController.index);

/**
 * 500 Error Handler.
 */

app.use(errorHandler());

/**
 * Start Express server.
 */

app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});


module.exports = app;