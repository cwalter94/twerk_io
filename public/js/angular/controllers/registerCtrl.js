var registerCtrl = app.controller('registerCtrl', function($scope, $http, $location, $cookieStore, $state, principal, flash) {
    $scope.user = {
    };
    $scope.allColleges = ['Engineering', 'Letters & Science', 'Chemistry', 'Natural Resources', 'Environmental Design', 'Haas School of Business'];

//    $scope.formData.colleges = [];
//    $scope.formData.pastHousePositions = [];
//    $scope.formData.status = 'Alumni';
    $scope.fromStateIndex = 0;
    $scope.toStateIndex = 1;
    $scope.leaveLeft = true;
    $scope.forms = [ '.email', '.name', '.password', '.repassword'];
    $scope.validForms = {};
    $scope.visitedForms = [];


    $scope.processRegForm = function() {
        if ($scope.formData.username && $scope.formData.password && $scope.formData.password === $scope.formData.repassword) {
            principal.register($scope.formData).then(function(data) {
                $location.path('/account/profile');
             }, function(error, data) {
                flash.error = error;
            });
        } else {
            if (angular.isUndefined($scope.formData.username)) {
                flash.error = 'You must provide an email.';
            }
            else if ($scope.formData.password !== $scope.formData.repassword) {
                flash.error = 'Passwords must match.';
            } else if (!$scope.formData.password){
                flash.error = 'You must provide a password.';
            } else {
                flash.error = 'Something went wrong. Please try again later.';
            }

        }

    };

    $scope.manualResetPassword = function() {
        if ($scope.formData.username !== undefined && $scope.formData.password !== undefined && $scope.formData.password === $scope.formData.repassword) {
            $http.post('/manualResetPassword',
                {
                    username: $scope.formData.username,
                    password: $scope.formData.password
                }
            )
        }
    };

    $scope.addresses = [];
    $scope.address = {};

    $scope.$on('$stateChangeStart',
        function(evt, toState, toParams, fromState, fromParams) {
            $scope.fromStateIndex = $scope.forms.indexOf(fromState.name.substring(fromState.name.lastIndexOf('.')));
            $scope.toStateIndex = $scope.forms.indexOf(toState.name.substring(toState.name.lastIndexOf('.')));

            $scope.leaveLeft = $scope.fromStateIndex < $scope.toStateIndex;
    });

    $scope.refreshAddresses = function(address) {
        var params = {address: address, sensor: false};
        return $http.get(
            'http://maps.googleapis.com/maps/api/geocode/json?',
            {params: params}
        ).success(function(data) {

                if (data.results) {
                    $scope.addresses = data.results;
                } else {
                    flash.error = 'Network connection error: unable to autofill addresses. Please enter address manually.';
                }

        }).error(function(error) {
                flash.error = 'Network connection error: unable to autofill addresses. Please enter address manually.';
            });
    };

    $scope.getUrl = function() {
        return $location.path()
    }

});