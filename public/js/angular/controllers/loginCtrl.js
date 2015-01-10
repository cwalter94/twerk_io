var loginCtrl = app.controller('loginCtrl', function($scope, $http, $location, $window, principal, flash) {

    $scope.processForm = function() {
        if ($scope.formData.email && $scope.formData.password ) {
            var credentials = {
                email: $scope.formData.email,
                password: $scope.formData.password
            };
            principal.login(credentials).then(function(data) {

                $location.path('/browse');
            }, (function(error) {
                flash.error = error;
            }));
        }
    };



    $scope.getUrl = function() {
        return $location.path()
    }

});