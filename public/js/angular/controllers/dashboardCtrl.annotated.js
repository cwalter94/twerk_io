var dashboardCtrl = app.controller('dashboardCtrl', ['$scope', '$http', '$location', 'users', 'flash', function($scope, $http, $location, users, flash) {

    $scope.users = users;


    $scope.takenPositions = [];
    $scope.openPositions = ["President", "VP Finance", "VP Loss Prevention", "VP Member Education",
        "VP Academic Excellence", "VP Administration", "House Improvement Chair", "VP External Relations",
        "Internal Social Chair", "External Social Chair", "Associate Member Educator", "Webmaster", "Scholarship Chair", "House Manager", "Recruitment Chair"];

    $scope.allPositions = ["President", "VP Finance", "VP Loss Prevention", "VP Member Education",
        "VP Academic Excellence", "VP Administration", "House Improvement Chair", "VP External Relations",
        "Internal Social Chair", "External Social Chair", "Associate Member Educator", "Webmaster", "Scholarship Chair", "House Manager", "Recruitment Chair"];

    $scope.lastsaved = [];

    for (var i = 0; i < $scope.users.length; i++) {
        var user = $scope.users[i];
        $scope.lastsaved[user._id] = angular.copy(user);

        for (var j = 0; j < user.housePositions.length; j++) {
            var index = $scope.openPositions.indexOf(user.housePositions[j]);
            if (index > -1) {
                $scope.openPositions.splice(index, 1);
            }
            $scope.takenPositions.push(user.housePositions[j]);
        }
    }

    $scope.needsSave = function(user) {


        function areDifferentArrays(a, b) {
            console.log(a);
            console.log(b);

            return (angular.isUndefined(a) && angular.isUndefined(b)) || (a == null && b == null) || (a.join(', ') !== b.join(', '));
        }

        var temp = $scope.lastsaved[user._id];
        return (temp.housePositions.length !== user.housePositions.length)
            || areDifferentArrays(user.housePositions, temp.housePositions)
            || areDifferentArrays(user.roles, temp.roles)
            || user.status !== temp.status;
    };

    $scope.openPosition = function(pos, user) {
        var index = user.housePositions.indexOf(pos);
        if (index > -1) {
            user.housePositions.splice(index, 1);
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
                $scope.lastsaved[user._id] = angular.copy(user);
                user.needsSave = false;
            })
            .error(function(err) {
                console.log(err);
                flash.error = 'An error occurred while saving data for ' + user.username + '. Please try again.';
            });
    };

    $scope.deleteUser = function(user) {
        flash.error = "This functionality doesn't work yet. Sorry.";
    }

}]);
