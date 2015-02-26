var groupCtrl = app.controller('groupCtrl', function($scope, $http, $location, $q, flash, $state, $stateParams, me, siteSocket, principal, userFactory, groupFactory, $rootScope) {
    $scope.groupPosts = [];
    $scope.userFactory = userFactory;
    $scope.groups = me.groups;
    $scope.Date = Date;
    $scope.groups = me.groups;
    $scope.currGroup = null;

    $scope.defaultGroupPost = {
        text: '<h2>welcome to twerkspaces!</h2><p><br/></p><h4>how it works:</h4><ul><ul><li>Add classes on the profile page or <a href="http://www.twerk.io/browse/intro/step1"><u>intro page</u></a></li><li>Select twerkspaces above to create posts that are visible to everyone in that class.</li><li>Find people who are twerking too.</li><li>Then twerk with those people.</li></ul></ul>'
    };


    if (angular.isUndefined($stateParams.url)) {
        var promises = [];

        angular.forEach(me.groups, function(group) {
            promises.push(groupFactory.getGroupPosts(group._id));
        });

        $q.all(promises).then(function(response) {

            angular.forEach(response, function(postSet) {
                angular.forEach(postSet, function(post) {
                    groupFactory.getCommentsForGroupPost(post);
                });
                $scope.groupPosts = $scope.groupPosts.concat(postSet);
            });
        }, function(err) {
            console.log(err);
            flash.error = err;
        });
    } else {
        for (var id in me.groups) {
            if (me.groups[id].url == $stateParams.url) {
                groupFactory.getGroupPosts(id).then(function(response) {
                    $scope.currGroup = me.groups[id];
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


    $scope.courseSearch = {
        selectedCourse: "",
        courses: [],
        departments: [],
        selectedDepartment: ""
    };

    $scope.addGroup = function() {

        $http({
            url: '/api/groups/' + $scope.courseSearch.selectedCourse + '/addUser',
            method: 'POST'
        }).success(function(response) {
            me.groups[response.group._id] = response.group;
            me.groups[response.group._id].groupPosts = [];
            $scope.courseSearch.selectedCourse = "";
        }).error(function(err) {
            flash.error = err;
        });

    };

    $scope.removeGroup = function(group) {
        $http({
            url: '/api/groups/' + group._id + '/removeUser',
            method: 'POST'
        }).success(function(response) {
            delete me.groups[group._id];
        }).error(function(err) {
            flash.error = err;
        });
    };

    $scope.getCoursesForDepartment = function(selectedDepartment) {
        $http({
            url: '/api/courses',
            method: 'GET',
            params: {
                department: selectedDepartment
            }
        }).success(function(data) {
            $scope.courseSearch.courses = data.courses;
        })

    };


    $scope.$watch('courseSearch.selectedDepartment', function(newval, oldval) {
        if (newval != "") {
            $scope.getCoursesForDepartment(newval);
        }
    });


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
            for (var id in me.groups) {
                if (me.groups[id].url == $stateParams.url) {
                    currGroup = me.groups[id];
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
                groupId: groupPost.groupId,
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
                groupId: groupPost.groupId,
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

    siteSocket.on('new:groupPost', function(groupPost) {
        if ($scope.groupPosts.indexOf(groupPost) == -1) {
            $scope.groupPosts.push(groupPost);
        }
    });

});
