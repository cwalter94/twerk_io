var registerCtrl = app.controller('registerCtrl', ['$scope', '$http', '$location', '$cookieStore', 'principal', function($scope, $http, $location, $cookieStore, principal) {
    $scope.user = {
    };
    $scope.allColleges = ['Engineering', 'Letters & Science', 'Chemistry', 'Natural Resources', 'Environmental Design', 'Haas School of Business'];
    $scope.allPositions = ["President", "VP Finance", "VP Loss Prevention", "VP Member Education",
        "VP Academic Excellence", "VP Administration", "House Improvement Chair", "VP External Relations",
        "Internal Social Chair", "External Social Chair", "Pledge Educator", "Hellmaster", "Webmaster", "Scholarship Chair", "House Manager", "Recruitment Chair"];

    $scope.formData = {colleges: [], pastHousePositions: [], status: 'Alumni'};


    $scope.processRegForm = function() {
        $scope.formData.address = $scope.address.selected.formatted_address;
        $scope.formData.college = $scope.formData.colleges.join(', ');

        if ($scope.formData.username !== undefined && $scope.formData.password !== undefined && $scope.formData.password === $scope.formData.repassword) {
            principal.register($scope.formData).then(function(data) {
                $location.path('/account/profile');
            }, (function(status, data) {
                flash.error = 'Something went wrong. Please try again later.';
            }));
        } else {
            if ($scope.formData.password !== $scope.formData.repassword) {
                flash.error = 'Passwords must match.';
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

}]);