var groupFactory = app.factory('groupFactory', function($http, $q) {
    var _groupPosts = {}, _groups = null, _comments = {};

    return {
        getGroups: function(user) {
            var deferred = $q.defer();
            if (_groups) {
                deferred.resolve(_groups);
            } else {
                $http(
                    {
                        url: '/api/groups',
                        method: 'GET'
                    }
                ).success(function(response) {
                        _groups = {};
                        for (var g = 0; g < response.groups.length; g++) {
                            _groupPosts[response.groups[g]._id] = [];
                            _groups[response.groups[g]._id] = response.groups[g];
                            _groups[response.groups[g]._id].groupPosts = null;
                        }
                        deferred.resolve(_groups);
                    }).error(function(err) {
                        deferred.reject(err);
                    });
            }
            return deferred.promise;
        },

        getGroupPosts: function(groupId) {
            var deferred = $q.defer();

            if (_groups[groupId] && _groups[groupId].groupPosts) {
                deferred.resolve(_groups[groupId].groupPosts);
            } else {
                if (!_groups[groupId].groupPosts) {
                    _groups[groupId].groupPosts = [];
                }

                $http({
                    url: '/api/groups/' + groupId + '/groupPosts',
                    method: 'GET'
                }).success(function(response) {
                    for (var p = 0; p < response.groupPosts.length; p++) {
                        var groupPost = response.groupPosts[p];
                        _groupPosts[groupPost._id] = groupPost;
                        _groups[groupId].groupPosts.push(_groupPosts[groupPost._id]);
                    }
                    deferred.resolve(_groups[groupId].groupPosts);
                }).error(function(err) {
                    deferred.reject(err);
                });
            }
            return deferred.promise;
        },

        getCommentsForGroupPost: function(groupPost) {
            var deferred = $q.defer();
            var promises = [];

            $http({
                url: '/api/comments/' + groupPost._id,
                method: 'GET'
            }).success(function(response) {
                _groupPosts[groupPost._id].comments = [];
                angular.forEach(response.comments, function(c) {
                    _comments[c._id] = c;
                    if (c.parentId == c.groupPostId) {
                        _groupPosts[groupPost._id].comments.push(_comments[c._id]);
                    }
                    c.children = [];
                });

                angular.forEach(response.comments, function(c) {
                    if (c.parentId !== c.groupPostId) {
                        _comments[c.parentId].children.push(c);
                    }
                });

                deferred.resolve(_groupPosts[groupPost._id].comments);

            }).error(function(err) {
                console.log(err);
                return null;
            });

            return deferred.promise;

        },

        submitNewPost: function(post, socket) {
            socket.emit('new:groupPost', post);
        },

        addNewPost: function(groupPost) {
            var deferred = $q.defer();
            _groupPosts[groupPost._id] = groupPost;
            _groupPosts[groupPost._id].comments = [];
            _groups[groupPost.groupId].groupPosts.push(_groupPosts[groupPost._id]);
            deferred.resolve(groupPost);
            return deferred.promise;
        },

        submitNewComment: function(comment, socket) {
            socket.emit('new:comment', comment);
        },

        addNewComment: function(comment) {
            var deferred = $q.defer();
            comment.children = [];
            _comments[comment._id] = comment;

            if (comment.groupPostId == comment.parentId) {
                _groupPosts[comment.groupPostId].comments.push(comment);
            } else {
                _comments[comment.parentId].children.push(_comments[comment._id]);
            }
        }

    }
});