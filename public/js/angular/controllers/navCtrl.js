var navCtrl = app.controller('navCtrl', function($scope, $location) {
    $scope.status = {
        isopen: true
    };

    $scope.getUrl = function() {
        return '' + $location.path();
    }
});