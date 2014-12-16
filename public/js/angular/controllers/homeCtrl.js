var homeController = app.controller('homeCtrl', function($scope, $http) {
    $scope.formData = {};
    $scope.user = {csrf: ""};
    $scope.emailChecked = false;

    $scope.showSuccess = function() {
        console.log("success");
    };

    $scope.showError = function(data) {
        console.log("error");
//        console.log(data);
    };

    $scope.updateInfo = function(data) {

    };

    $scope.verifyEmailCode = function(code) {
        if (code.length == 5 && !$scope.emailChecked) {
            $http({
                method: 'GET',
                url: 'api/verify/emailcode?email=' + $scope.formData.email + '&code=' + code
            }).
                success(function(data, status, headers, config) {
                    console.log(data);
                    return true;
                }).
                error(function(data, status, headers, config) {

                    $scope.showError(data);
                    return false;
                });
        $scope.emailChecked = true;
        }
    };

    $scope.verifyEmail = function(email) {
        $http({
            method: 'GET',
            url: '/api/verify/email?email=' + email + '&name=' + $scope.formData.name

        }).
            success(function(data, status, headers, config) {
//                console.log(data);
                $scope.showSuccess();
                return true;
            }).
            error(function(data, status, headers, config) {
                $scope.showError();
                return false;
            });

    };

    $scope.processForm = function() {
        $http({
            method: 'POST',
            url: '/api/request',
            headers: {
                'x-csrf-token': $scope.user.csrf
            },
            data: $scope.formData
        }).
            success(function(data, status, headers, config) {
                console.log(data);
                console.log($scope.user);
                $scope.showSuccess();
            }).
            error(function(data, status, headers, config) {
                $scope.showError();
            });

    };
});