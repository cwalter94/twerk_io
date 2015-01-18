var registerCtrl = app.controller('registerCtrl', function($scope, $http, $location, $cookieStore, $state, principal, flash) {
    $scope.user = {
    };


    $scope.fromStateIndex = 0;
    $scope.toStateIndex = 1;
    $scope.leaveLeft = true;
    $scope.forms = [ '.email', '.name', '.password', '.repassword'];
    $scope.validForms = {};


    $scope.processRegForm = function() {

        if ($scope.formData.email && $scope.formData.password && $scope.formData.password === $scope.formData.repassword) {
            if ($scope.formData.email.indexOf('@berkeley.edu') == -1) {
                flash.error = 'You must provide a valid Berkeley email.';
            } else if (!$scope.formData.password){
                flash.error = 'You must provide a password.';
            } else {
                principal.register($scope.formData).then(function(data) {
                    $state.transitionTo('site.auth.verify', { reload: false, inherit: true, notify: true });
                }, function(error, data) {
                    flash.error = error;
                });
            }


        } else if ($scope.formData.password !== $scope.formData.repassword){
            flash.error = 'Passwords must match.';
        } else if (!$scope.formData.email) {
            flash.error = 'You must provide a valid Berkeley email.';
        } else {
            flash.error = 'An unknown error occurred. Please try again later.';
        }

    };



    $scope.$on('$stateChangeStart',
        function(evt, toState, toParams, fromState, fromParams) {
            $scope.fromStateIndex = $scope.forms.indexOf(fromState.name.substring(fromState.name.lastIndexOf('.')));
            $scope.toStateIndex = $scope.forms.indexOf(toState.name.substring(toState.name.lastIndexOf('.')));

            $scope.leaveLeft = $scope.fromStateIndex < $scope.toStateIndex;
    });


    $scope.getUrl = function() {
        return $location.path()
    }

});