var livePostFactory = app.factory('livePostFactory', function($http, $q) {
    var _livePosts = {}, _livePostArr = [], _comments = {}, _allPostsLoaded = false, _unconfirmedPosts = {};

    return {
        getLivePosts: function() {
            var deferred = $q.defer();

            if (_livePostArr.length == 0) {
                $http({
                    url: '/api/liveposts',
                    method: 'GET'
                }).success(function(response) {

                    for (var p = 0; p < response.livePosts.length; p++) {
                        var livePost = response.livePosts[p];
                        _livePosts[livePost._id] = livePost;
                        _livePostArr.push(livePost);
                    }
                    deferred.resolve(_livePostArr);
                }).error(function(err) {
                    deferred.reject(err);
                });

                return deferred.promise;

            } else {
                return _livePostArr;
            }

        },

        getMoreLivePosts: function() {
            var deferred = $q.defer();

            if (!_allPostsLoaded) {
                $http({
                    url: '/api/moreliveposts',
                    method: 'GET',
                    params: {
                        skip: _livePostArr.length
                    }
                }).success(function(response) {
                    if (!response.livePosts.length) {
                        _allPostsLoaded = true;
                        deferred.reject('No More Posts To Display.');
                    } else {
                        for (var p = 0; p < response.livePosts.length; p++) {
                            var livePost = response.livePosts[p];
                            _livePosts[livePost._id] = livePost;
                            _livePostArr.push(livePost);
                        }
                    }
                    deferred.resolve(_livePostArr);
                }).error(function(err) {
                    deferred.reject(err);
                });

            } else {
                deferred.reject('No More Posts To Display.');
            }

            return deferred.promise;
        },

        getCommentsForLivePost: function(livePost) {
            var deferred = $q.defer();
            var promises = [];

            $http({
                url: '/api/comments/' + livePost._id,
                method: 'GET'
            }).success(function(response) {
                _livePosts[livePost._id].comments = [];
                angular.forEach(response.comments, function(c) {
                    _comments[c._id] = c;
                    if (c.parentId == c.livePostId) {
                        _livePosts[livePost._id].comments.push(_comments[c._id]);
                    }
                    c.children = [];
                });

                angular.forEach(response.comments, function(c) {
                    if (c.parentId !== c.livePostId) {
                        _comments[c.parentId].children.push(c);
                    }
                });

                deferred.resolve(_livePosts[livePost._id].comments);

            }).error(function(err) {
                console.log(err);
                return null;
            });

            return deferred.promise;

        },

        submitNewPost: function(post, socket) {
            socket.emit('new:livePost', post);
        },

        addNewPost: function(livePost) {
            var deferred = $q.defer();
            _livePosts[livePost._id] = livePost;
            _livePosts[livePost._id].comments = [];
            deferred.resolve(livePost);
            return deferred.promise;
        },

        submitNewComment: function(comment, socket) {
            socket.emit('new:comment', comment);
        },

        addNewComment: function(comment) {
            var deferred = $q.defer();
            comment.children = [];
            _comments[comment._id] = comment;

            if (comment.livePostId == comment.parentId) {
                console.log(_livePosts, comment);
                _livePosts[comment.livePostId].comments.push(comment);
            } else {
                _comments[comment.parentId].children.push(_comments[comment._id]);
            }
        }

    }
});