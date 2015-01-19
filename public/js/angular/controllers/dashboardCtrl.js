var dashboardCtrl = app.controller('dashboardCtrl', function($scope, $http, $location, users, flash) {

    $scope.users = users;


    $scope.takenPositions = [];
    $scope.allPositions = ["President", "VP Finance", "VP Loss Prevention", "VP Member Education",
        "VP Academic Excellence", "VP Administration", "House Improvement Chair", "VP External Relations",
        "Internal Social Chair", "External Social Chair", "Pledge Educator", "Hellmaster", "Webmaster",
        "Scholarship Chair", "House Manager", "Recruitment Chair", "Summer Manager"];

    $scope.allPositions = angular.copy($scope.openPositions);

    $scope.lastSaved = [];

    for (var i = 0; i < $scope.users.length; i++) {
        var user = $scope.users[i];
        $scope.lastSaved[user._id] = angular.copy(user);

        for (var j = 0; j < user.housePositions.length; j++) {
            var index = $scope.openPositions.indexOf(user.housePositions[j]);

            if (index > -1) {
                $scope.openPositions.splice(index, 1);
            }
            $scope.takenPositions.push(user.housePositions[j]);
        }
    }

    $scope.needsSave = function(user) {
        return $scope.lastSaved[user._id] ? !angular.equals(user, $scope.lastSaved[user._id]) : true;
    };

    $scope.print = function(obj) {
        console.log(obj);
    };

    $scope.openPosition = function(pos, user) {
        var index = user.housePositions.indexOf(pos);
        if (index > -1) {
            user.housePositions.splice(index, 1);
        }

        index = $scope.openPositions.indexOf(pos);
        if (index == -1) {
            $scope.openPositions.push(pos);
        }

        user.needsSave = $scope.needsSave(user);

        index = $scope.takenPositions.indexOf(pos);
        if (index > -1) {
            $scope.takenPositions.splice(index, 1);
        }
    };

    $scope.takePosition = function(pos, user) {
        var index = user.housePositions.indexOf(pos);
        if (index == -1) {
            user.housePositions.push(pos);
        }

        index = $scope.openPositions.indexOf(pos);

        if (index > -1) {
            $scope.openPositions.splice(index, 1);
        }

        user.needsSave = $scope.needsSave(user);

        index = $scope.takenPositions.indexOf(pos);

        if (index == -1) {
            $scope.takenPositions.push(pos);
        }
    };

    $scope.dataChanged = false;
    $scope.dropSupported = true;
    $scope.disabled = undefined;
    $scope.allRoles = ["User", "Admin", "Blogger", "Excomm"];
    $scope.statusSelect = {
        isopen: false
    };

    $scope.statuses = ['Active', 'Alumni', 'Pledge'];
    $scope.posSelect = {
        isopen: false
    };
    $scope.addresses = [];
    $scope.address = {};
    $scope.formData = {};

    $scope.saveUser = function(user) {

        $http.post('/api/admin/saveuser', {user: user})
            .success(function(data) {
                flash.success = 'Profile for ' + user.username + ' saved successfully.';
                $scope.lastSaved[user._id] = angular.copy(user);
                user.needsSave = false;
            })
            .error(function(err) {
                flash.error = 'An error occurred while saving data for ' + user.username + '. Please try again.';
            });
    };

    $scope.deleteUser = function(user) {

        $http.post('/api/admin/deleteuser', {user: user})
            .success(function(data) {

                flash.success = 'Profile for ' + user.username + ' deleted successfully.';
                $scope.lastSaved[user._id] = null;
                user = null;
            })
            .error(function(err) {
                console.log(err);
                flash.error = 'An error occurred while saving data for ' + user.username + '. Please try again.';
            });
    };

});
