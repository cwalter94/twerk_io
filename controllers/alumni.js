var User = require('../models/User');

/**
 * GET /alumni
 * Login page.
 */

exports.index = function (req, res) {
    res.render('alumni/index', {
        title: 'DU California Alumni'
    });
};

