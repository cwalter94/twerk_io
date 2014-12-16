/**
 * GET /
 * Home page.
 */
var User = require('../models/User');

exports.data = function(data) {
    var excommTitles = ["president", "vpfinance", "vplossprevention", "vpmembereducation", "vpmembereducationtwo",
        "vpacademicexcellence", "vpadministration", "houseimprovementchair", "vpexternalrelations", "internalsocialchair", "associatemembereducator"];

    var excomm = {};
    for (i in excommTitles) {
        excomm[excommTitles[i]] = {
            name: "",
            picture: "",
            email: ""
        }
    }

    var excommUsers = User
        .find({})
        .where('excomm').equals(true)
        .exec(function(err, users) {
            for (u in users) {
                var user = users[u];
                excomm['' + user.excommPosition] = {
                    name: user.profile.name,
                    picture: user.profile.picture,
                    email: user.email
                };
            }
            console.log("inside homecontroller data");
            console.log(excomm);
            data.excomm = excomm
        });
    return data

};
