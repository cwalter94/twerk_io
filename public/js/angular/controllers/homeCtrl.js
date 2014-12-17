var homeController = app.controller('homeCtrl', function($scope, $http) {
    $scope.formData = {email: "", password: "", repassword: ""};
    $scope.user = {csrf: ""};
    $scope.emailChecked = false;
    $scope.registered = false;

    $scope.showSuccess = function() {
        console.log("success");
    };

    $scope.showError = function(data) {
        console.log("error");
//        console.log(data);
    };

    $scope.updateInfo = function(data) {

    };

    $scope.verifyEmailCode = function() {
        if ($scope.formData.code.length == 5 && !$scope.emailChecked) {
            $http({
                method: 'GET',
                url: 'api/verify/emailcode?email=' + $scope.formData.email + '&code=' + $scope.formData.code
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

    $scope.request = function() {

        if ($scope.user.loggedin) {
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

        }
    };

    $scope.verifyEmail = function(email) {
        $http({
            method: 'GET',
            url: '/api/verify/email?email=' + email

        }).
            success(function(data, status, headers, config) {
                $scope.registered = data.registered;
                $scope.showSuccess();
                return true;
            }).
            error(function(data, status, headers, config) {
                $scope.showError();
                return false;
            });

    };

    $scope.login = function() {

        var temp = $scope.formData;

        if (temp.email.length > 3 && temp.password.length > 1) {
            $http({
                method: 'POST',
                url: '/api/login',
                headers: {
                    'x-csrf-token': $scope.user.csrf
                },
                data: {
                username: $scope.formData.email,
                    password: $scope.formData.password
            }
            }).
                success(function(data, status, headers, config) {
                    console.log(data);
                    $scope.showSuccess();
                }).
                error(function(data, status, headers, config) {
                    console.log(data);
                    console.log(status);
                    console.log(headers);
                    console.log(config);
                    $scope.showError();
                });

        }

    };
    $scope.register = function() {

            var temp = $scope.formData;
            if (temp.email.length > 3 && temp.password.length > 1 && temp.password == temp.repassword) {
                $http({
                    method: 'POST',
                    url: '/api/register',
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

            }

    };
});