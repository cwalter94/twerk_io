var loginCtrl = app.controller('loginCtrl', ['$scope', '$http', '$location', '$window', 'principal', 'flash', function($scope, $http, $location, $window, principal, flash) {
    $scope.csrf = "";

    $scope.user = {
    };

    $scope.formData = {
        username: "",
        password: ""
    };



    $scope.processForm = function() {
        if ($scope.formData.username !== undefined && $scope.formData.password !== undefined) {
            var credentials = {
                username: $scope.formData.username,
                password: $scope.formData.password
            };
            principal.login(credentials).then(function(data) {
                $location.path('/account/profile');
            }, (function(status, data) {
                flash.error = 'Wrong username or password.';
                console.log(status);

            }));
        }
    };

    $scope.addresses = [];
    $scope.address = {};


    $scope.getUrl = function() {
        return $location.path()
    }

}]);