var blogCtrl = app.controller('blogCtrl', function($scope, $http, flash, $sce) {

    $scope.user = {
    };
    $scope.posts = [];

    $scope.renderHtml = function(html_code)
    {
        return $sce.trustAsHtml(html_code);
    };

    $scope.getPosts = function() {
        $http({
            method: 'GET',
            url: '/blog/posts'
        }).
            success(function(data, status, headers, config) {
                $scope.posts = data;
            }).
            error(function(data, status, headers, config) {
                console.log(data);
            });
    };
});