var blogCtrl = app.controller('blogCtrl', function($scope, $http, flash, $sce, posts) {

    $scope.user = {
    };
    $scope.posts = posts;

    $scope.renderHtml = function(html_code)
    {
        return $sce.trustAsHtml(html_code);
    };

});