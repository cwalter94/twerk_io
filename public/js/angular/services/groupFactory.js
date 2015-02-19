var groupFactory = app.factory('groupFactory', function($http, $q) {
    var _groupPosts = {}, _groups = null;

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
                            _groups[response.groups[g]._id].groupPosts = _groupPosts[response.groups[g]._id];
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

            if (_groupPosts[groupId] && _groupPosts[groupId].length > 0) {
                deferred.resolve(_groupPosts[groupId]);
            } else {
                if (!_groupPosts[groupId]) {
                    _groupPosts[groupId] = [];
                }

                $http({
                    url: '/api/groups/' + groupId + '/groupPosts',
                    method: 'GET'
                }).success(function(response) {
                    for (var p = 0; p < response.groupPosts.length; p++) {
                        var groupPost = response.groupPosts[p];
                        _groupPosts[groupId].push(groupPost);
                    }
                    deferred.resolve(_groupPosts[groupId]);
                }).error(function(err) {
                    deferred.reject(err);
                });
            }
            return deferred.promise;
        },

        submitNewPost: function(post, socket) {
            socket.emit('new:groupPost', post);
            this.addNewPost(post);
        },

        addNewPost: function(groupPost) {
            var deferred = $q.defer();
            _groupPosts[groupPost.groupId].push(groupPost);
            deferred.resolve(groupPost);
            return deferred.promise;
        }

    }
});