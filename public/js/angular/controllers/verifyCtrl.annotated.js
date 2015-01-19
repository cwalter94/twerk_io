var verifyCtrl = app.controller('verifyCtrl', ['$scope', '$upload', '$http', function($scope, $upload, $http) {
    $scope.user = {
    };

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
                console.log(address);
                console.log($scope.addresses);
            });
    };

}]);