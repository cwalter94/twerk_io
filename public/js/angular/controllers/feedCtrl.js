var feedCtrl = app.controller('feedCtrl', function($scope, $http, $location, $q, flash, $state, $stateParams, me, siteSocket, principal, userFactory, livePostFactory, $rootScope) {
    $scope.livePosts = [];
    $scope.userFactory = userFactory;
    $scope.groups = me.groups;
    $scope.Date = Date;
    $scope.groups = me.groups;
    $scope.currGroup = null;
    $scope.me = me;

    $scope.courseSearch = {
        selectedCourse: "",
        courses: [],
        departments: [],
        selectedDepartment: ""
    };

    $http({
        url: '/api/departments',
        method: 'GET'
    }).success(function(data) {
        $scope.courseSearch.departments = data.departments;
    });

    livePostFactory.getLivePosts().then(function(livePosts) {
       $scope.livePosts = livePosts;
    }, function(err) {
        console.log(err);
    });


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

    $scope.newLivePost = {
        location: "",
        classes: [],
        createdByName: me.name,
        createdBy: me._id
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
        $scope.livePostTextarea.text = "";
    };

    $scope.submitLivePost = function() {

        if ($scope.newLivePost.location === "" || $scope.courseSearch.selectedCourse == null) {
            flash.error = 'Class and location must be present to make a post.';
        } else {
            $scope.newLivePost.classes.push($scope.courseSearch.selectedCourse);
            livePostFactory.submitNewPost($scope.newLivePost, siteSocket);
            $scope.newLivePost.location = "";
            $scope.newLivePost.classes = [];
            $scope.courseSearch.selectedCourse = "";
            $scope.courseSearch.selectedDepartment = "";

        }
    };

    $scope.submitComment = function(livePost, parent) {
        if ($scope.commentTextarea.text != "" && parent) {
            var c = {
                text: $scope.commentTextarea.text,
                livePostId: livePost._id,
                groupId: livePost.groupId,
                parentId: parent != null ? parent._id : livePost._id,
                createdBy: me._id
            };

            groupFactory.submitNewComment(c, siteSocket);

            $scope.commentTextarea.text = "";
            livePost.newCommentText = "";
            $scope.commentTextarea.currentPostComment = null;
        } else if (livePost.newCommentText) {
            var c = {
                text: livePost.newCommentText,
                livePostId: livePost._id,
                groupId: livePost.groupId,
                parentId: parent != null ? parent._id : livePost._id,
                createdBy: me._id
            };

            groupFactory.submitNewComment(c, siteSocket);

            $scope.commentTextarea.text = "";
            livePost.newCommentText = "";
            $scope.commentTextarea.currentPostComment = null;
        } else {
            flash.err = 'Empty comments cannot be posted.';
        }
    }

    siteSocket.on('new:livePost', function(livePost) {
        if ($scope.livePosts.indexOf(livePost) == -1) {
            $scope.livePosts.push(livePost);
        }
    });

});
