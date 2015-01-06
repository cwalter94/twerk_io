var loginCtrl = app.controller('loginCtrl', function($scope, $http, $location, $window, principal, flash) {
    $scope.csrf = "";

    $scope.user = {
    };


    $scope.processForm = function() {
        if ($scope.formData.username !== undefined && $scope.formData.password !== undefined) {
            var credentials = {
                username: $scope.formData.username,
                password: $scope.formData.password
            };
            principal.login(credentials).then(function(data) {
                $location.path('/account/profile');
            }, (function(error) {
                flash.error = error;
            }));
        }
    };

    $scope.addresses = [];
    $scope.address = {};


    $scope.getUrl = function() {
        return $location.path()
    }

});