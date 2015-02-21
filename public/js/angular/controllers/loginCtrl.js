var loginCtrl = app.controller('loginCtrl', function($scope, $http, $location, $window, principal, flash, $state) {


    $scope.processForm = function() {
        if ($scope.formData.email && $scope.formData.password ) {
            var credentials = {
                email: $scope.formData.email,
                password: $scope.formData.password
            };
            principal.login(credentials).then(function(identity) {
                if (!identity.verified) {
                    $state.transitionTo('site.auth.verify');
                } else {
                    $state.transitionTo('site.auth.browse.all');
                }
            }, (function(error) {
                flash.error = error;
            }));
        }
    };



    $scope.getUrl = function() {
        return $location.path()
    }

});