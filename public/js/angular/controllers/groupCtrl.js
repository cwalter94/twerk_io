var groupCtrl = app.controller('groupCtrl', function($scope, $http, $location, $q, flash, $state, $stateParams, me, groups, siteSocket, principal, userFactory, groupFactory) {
    $scope.groupPosts = [];
    $scope.userFactory = userFactory;
    $scope.groups = groups;
    $scope.currGroup = null;

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
                    $scope.currGroup = groups[id];
                    $scope.groupPosts = response;
                    var promises = [];
                    angular.forEach($scope.groupPosts, function(groupPost) {
                        groupFactory.getCommentsForGroupPost(groupPost).then(function(response) {

                        });
                    });
                }, function(err) {
                    console.log(err);
                });
                break;
            }
        }
    }

    $scope.setCurrentComment = function(child) {
        $scope.commentTextarea.currentPostComment = child;
        child.minimizeChildren = true;
    };

    $scope.getNumberChildren = function(child) {
        if (!child.children || child.children.length == 0) {
            return 0;
        }
        var countArr = [];

        for (var i = 0; i < child.children.length; i++) {
            countArr.push($scope.getNumberChildren(child.children[i]));
        }
        var total = child.children.length;

        angular.forEach(countArr, function(count) {
            total += count;
        });

        return total;
    };

    $scope.formatDate = principal.formatDate;

    $scope.groupPostTextarea = {
    };

    $scope.commentTextarea = {
        toolbar: [['bold','italics','underline','pre','quote','insertImage','insertVideo', 'ul', 'ol']],
        currentPostComment: "emptystring"
    };

    $scope.cancelComment = function() {
        $scope.commentTextarea.currentPostComment = "emptystring";
        $scope.commentTextarea.text = "";
    };

    $scope.textareaMinimize = true;

    $scope.getUser = function(item) {
        if (item) {
            if (item.createdBy == me._id) {
                item.user = {
                    name: me.name,
                    picture: me.picture,
                    email: me.email,
                    _id: me._id
                };
            } else {
                item.user = {};
                return userFactory.getUsersByIds([item.createdBy]).then(function(usersArr) {
                    item.user = usersArr[0];
                }, function(err) {
                    flash.error = err;
                    return null;
                });
            }
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
    };

    $scope.submitComment = function(groupPost, parent) {
        if ($scope.commentTextarea.text != "" && parent) {
            var c = {
                text: $scope.commentTextarea.text,
                groupPostId: groupPost._id,
                groupId: $scope.currGroup._id,
                parentId: parent != null ? parent._id : groupPost._id,
                createdBy: me._id
            };

            groupFactory.submitNewComment(c, siteSocket);

            $scope.commentTextarea.text = "";
            groupPost.newCommentText = "";
            $scope.commentTextarea.currentPostComment = null;
        } else if (groupPost.newCommentText) {
            var c = {
                text: groupPost.newCommentText,
                groupPostId: groupPost._id,
                groupId: $scope.currGroup._id,
                parentId: parent != null ? parent._id : groupPost._id,
                createdBy: me._id
            };

            groupFactory.submitNewComment(c, siteSocket);

            $scope.commentTextarea.text = "";
            groupPost.newCommentText = "";
            $scope.commentTextarea.currentPostComment = null;
        } else {
            flash.err = 'Empty comments cannot be posted.';
        }
    }

});
