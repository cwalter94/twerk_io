var groupCtrl = app.controller('groupCtrl', function($scope, $http, $location, $q, flash, $state, $stateParams, me, groups, siteSocket, principal, userFactory, groupFactory) {
    var promises = [];

    angular.forEach(groups, function(group) {
        promises.push(groupFactory.getGroupPosts(group._id));
    });

    $q.all(promises).then(function(response) {
        console.log('$q.all response', response);
        console.log('promises', promises);
    }, function(err) {
        console.log(err);
        flash.error = err;
    });

    $scope.groupPostTextarea = {
        toolbar: [['bold','italics','underline','pre','quote','insertImage','insertVideo', 'ul', 'ol']]
    };

    $scope.textareaMinimize = true;

    $scope.cancelTextarea = function() {
        $scope.textareaMinimize = true;
        $scope.groupPostTextarea.text = "";
    };

    $scope.submitGroupPost = function() {

    }

});
