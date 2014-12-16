var loginCtrl = app.controller('loginCtrl', function($scope, $upload, $http, $location) {
    $scope.user = {
    };

    $scope.form = ($location.path() != '/scholarship');

    $scope.formData = {};

    $scope.processForm = function() {

    };

    $scope.addresses = [];
    $scope.address = {};

    $scope.refreshAddresses = function(address) {
        var params = {address: address, sensor: false};
        return $http.get(
            'http://maps.googleapis.com/maps/api/geocode/json',
            {params: params}
        ).then(function(response) {
                $scope.addresses = response.data.results;
            });
    };

    $scope.getUrl = function() {
        return $location.path()
    }

});