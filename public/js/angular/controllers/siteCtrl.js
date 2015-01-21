app.controller('siteCtrl', function ($scope, $location, principal, siteSocket, $rootScope, $state) {
    $scope.users = {};

    $scope.setCurrentUser = function (user) {
        $scope.currentUser = user;
    };

    $rootScope.$on('$stateChangeError',
        function(event, toState, toParams, fromState, fromParams, error){
            console.log(event);
            console.log(error);
        });


    $scope.principal = principal;
    $scope.newMessages = 0;
    $scope.userAuthenticated = principal.isAuthenticated();

    $scope.getUrl = function() {
        return '' + $location.path();
    };

    $scope.logout = function() {
        principal.logout().then(function(data) {
            $state.transitionTo($state.current, {}, {reload: true});
            siteSocket.emit('disconnect');
        }, (function(error) {
            flash.error = error;
        }));
    }
});