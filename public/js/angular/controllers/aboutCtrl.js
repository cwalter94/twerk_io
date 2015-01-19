var aboutCtrl = app.controller('aboutCtrl', function($scope, $http, $upload, excomm, authorize, flash) {

    $scope.data = {
        excomm: excomm
    };

    $scope.user = {
    };

    $scope.authorize = authorize;

    $scope.showSuccess = function() {

    };


    $scope.editButton = true;
    $scope.data.excomm = excomm;

});