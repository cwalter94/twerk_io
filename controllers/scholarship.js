var User = require('../models/User');

/**
 * GET /scholarship
 * scholarship page
 */

exports.index = function (req, res) {
    res.render('scholarship/index', {
        title: 'DU California | Scholarship'
    });
};


