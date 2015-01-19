app.controller('siteCtrl', ['$scope', '$location', 'principal', function ($scope, $location, principal) {

    $scope.setCurrentUser = function (user) {
        $scope.currentUser = user;
    };

    $scope.principal = principal;


    $scope.getUrl = function() {

        return '' + $location.path();
    };

    $scope.logout = function() {

        $scope.principal.logout();
        if ($location.path() === '/account/profile') {
            $location.path('/');
        }

    }
}]);