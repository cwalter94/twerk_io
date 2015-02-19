var groupCtrl = app.controller('groupCtrl', function($scope, $http, $location, $q, flash, $state, $stateParams, me, groups, siteSocket, principal, userFactory, groupFactory) {
    $scope.groupPosts = [];
    $scope.userFactory = userFactory;
    $scope.groups = groups;

    if ($stateParams.url == '') {
        var promises = [];

        for (var id in groups) {
            promises.push(groupFactory.getGroupPosts(id));
        }

        $q.all(promises).then(function(response) {
            angular.forEach(response, function(postSet) {
                $scope.groupPosts.concat(postSet);
            });
        }, function(err) {
            console.log(err);
            flash.error = err;
        });
    } else {
        for (var id in groups) {
            if (groups[id].url == $stateParams.url) {
                groupFactory.getGroupPosts(id).then(function(response) {
                    console.log(response);
                    $scope.groupPosts = response;
                }, function(err) {
                    console.log(err);
                });
                break;
            }
        }
    }


    $scope.groupPostTextarea = {
        toolbar: [['bold','italics','underline','pre','quote','insertImage','insertVideo', 'ul', 'ol']]
    };

    $scope.textareaMinimize = true;

    $scope.getUser = function(groupPost) {
        if (groupPost.createdBy == me._id) {
            groupPost.user = me;
        } else {
            groupPost.user = {};
            return userFactory.getUsersByIds([groupPost.createdBy]).then(function(usersArr) {
                groupPost.user = usersArr[0];
            }, function(err) {
                flash.error = err;
                return null;
            });
        }

    };

    $scope.cancelTextarea = function() {
        $scope.textareaMinimize = true;
        $scope.groupPostTextarea.text = "";
    };

    $scope.submitGroupPost = function() {
        if ($scope.groupPostTextarea.text == null) {
            flash.error = 'Text must be included to make a post.';
        } else {
            var currGroup = null;
            for (var id in groups) {
                if (groups[id].url == $stateParams.url) {
                    currGroup = groups[id];
                    break;
                }
            }

            if (currGroup != null) {
                var newPost = {
                    groupId: currGroup._id,
                    text: $scope.groupPostTextarea.text,
                    createdBy: me._id
                };

                groupFactory.submitNewPost(newPost, siteSocket);
                $scope.groupPostTextarea.text = "";
            }

        }
    }

});
