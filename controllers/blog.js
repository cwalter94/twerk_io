
var User = require('../models/User');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var secrets = require('../config/secrets');
var BlogPost = require('../models/BlogPost');
var multiparty = require('multiparty');
var uuid = require('uuid');
var fs = require('fs');

/**
 * GET /blog
 * Blog page.
 */
exports.index = function(req, res) {
    BlogPost
        .find({}, function(err, posts) {
            res.render('blog', {
                title: 'DU Blog'
            });
        });
//    res.render('/blog', {
//        title: 'DU California Blog',
//        posts: []
//    });
};

/**
 * Check if blog author is authenticated before accessing /new
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.isAuthenticated = function(req, res, next) {
    if (req.user.email == "historian@ducalifornia.org") return next();
    res.redirect('/login');
};

/**
 * GET /blog/new
 * Page for creating a new blog post.
 */

exports.getNewBlogPost = function (req, res) {
    res.render('newblogpost', {
        title: 'New Blog Post'
    });
};

exports.getPosts = function(req, res) {
    BlogPost
        .find({}, function(err, posts) {
            res.json(posts);
        });
};


/**
 * POST /blog/new
 * Publishing a new blog post.
 * @param email
 * @param password
 * @param role
 */

exports.postNewBlogPost = function (req, res, next) {

    var blogPost = new BlogPost({
        title: req.body.title,
        text: req.body.text,
        pictures: req.body.pictures,
        author: req.body.author,
        comments: [],
        draft: false
    });


    blogPost.save(function (err) {
        if (err) return next(err);
        res.redirect('/blog');
        });

};

exports.postBlogPicture = function (req, res, next) {
    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        var file = files.file[0];
        var contentType = file.headers['content-type'];
        var tmpPath = file.path;
        var extIndex = tmpPath.lastIndexOf('.');
        var extension = (extIndex < 0) ? '' : tmpPath.substr(extIndex);
        // uuid is for generating unique filenames.
        var fileName = uuid.v4() + extension;
        var destPath = 'public/img/blog/' + fileName;

        // Server side file type checker.
        if (contentType !== 'image/png' && contentType !== 'image/jpeg') {
            fs.unlink(tmpPath);
            return res.status(400).send('Unsupported file type.');
        }

        fs.rename(tmpPath, destPath, function (err) {
            if (err) {
                return res.status(400).send('Image is not saved.');
            }
            return res.json({picture: destPath.substring(6)});
        });
    });
};