var userFactory = app.factory('userFactory', function($http, $q) {
    var _allUsers = null, _allUsersArr = [], _sortBy = 'statusCreated', _usersOnlineStatus = {};

    return {
        getUsers: function() {
            var deferred = $q.defer();

            if (_allUsers) {
                deferred.resolve(_allUsers);
            } else {
                $http({
                    url: '/api/users/browse',
                    method: 'GET',
                    params: {
                        num: 20,
                        sortBy: _sortBy,
                        start: 0
                    }
                }).success(function(data) {
                    if (!_allUsers)  {
                        _allUsers = {};
                    }

                    for (var u in data.users) {
                        var user = data.users[u];
                        if (!_usersOnlineStatus[user._id]) {
                            _usersOnlineStatus[user._id] = {online: false, lastOnline: user.lastOnline, currentRoomId: null};
                        }

                        if (!_allUsers[user._id]) {
                            _allUsers[user._id] = user;
                        }
                        _allUsers[user._id].onlineStatus =  _usersOnlineStatus[user._id];

                    }

                    deferred.resolve(_allUsers);

                }).error(function(err) {
                    deferred.reject(err);
                })
            }
            return deferred.promise;
        },
        getMoreUsers: function(sortBy) {
            var deferred = $q.defer();
            var start = 0;

            if (!sortBy || sortBy == _sortBy) {
                start = _allUsersArr.length;
            }

            _sortBy = sortBy;

            this.getUsers().then(function(data) {
                $http({
                    url: '/api/users/browse',
                    method: 'GET',
                    params: {
                        num: 10,
                        sortBy: _sortBy,
                        start: start
                    }
                }).success(function(data) {
                    for (var u in data.users) {
                        var user = data.users[u];
                        if (!_usersOnlineStatus[user._id]) {
                            _usersOnlineStatus[user._id] = {online: false, lastOnline: null, currentRoomId: null};
                        }
                        _allUsers[user._id] = user;
                        _allUsers[user._id].onlineStatus = _usersOnlineStatus[user._id];
                    }
                    deferred.resolve(_allUsers);
                }).error(function(err) {
                    deferred.reject(err);
                })
            }, function(err) {
                deferred.reject(err);
            });

            return deferred.promise;
        },
        getUsersByIds: function(userIdsArr) {
            var deferred = $q.defer();
            var neededUsers = [];
            var result = [];

            this.getUsers().then(function(allUsersList) {
                for (var i = 0; i < userIdsArr.length; i++) {
                    var userId = userIdsArr[i];
                    if (!_allUsers[userId]) {
                        neededUsers.push(userId);

                    } else {
                        result.push(_allUsers[userId]);
                    }
                }

                if (neededUsers.length > 0) {
                    $http({
                        url: '/api/users',
                        method: 'GET',
                        params: {
                            userIds: neededUsers
                        }
                    }).success(function(users) {

                        for (var i = 0; i < users.length; i++) {
                            var user = users[i];

                            if (!_usersOnlineStatus[user._id]) {
                                _usersOnlineStatus[user._id] = {online: false, lastOnline: null, currentRoomId: null};
                            }

                            _allUsers[user._id] = user;
                            _allUsers[user._id].onlineStatus = _usersOnlineStatus[user._id];
                            result.push(_allUsers[user._id]);
                        }
                        deferred.resolve(result);
                    }).error(function(err) {
                        deferred.reject(err);
                    });
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise;
        },
        getUsersObj: function() {
            var deferred = $q.defer();
            this.getUsers().then(function(allUsers) {
                deferred.resolve(_allUsers);
            }, function(err) {
                deferred.reject(err);
            });
            return deferred.promise;
        },
        userOnline: function(userId) {
            var deferred = $q.defer();

            this.getUsers().then(function(allUsers) {
                if (_usersOnlineStatus[userId] == null) {
                    _usersOnlineStatus[userId] = {online: true, lastOnline: Date.now(), currentRoomId: null};

                } else {
                    _usersOnlineStatus[userId].online = true;
                    _usersOnlineStatus[userId].lastOnline = Date.now();
                }

                if (_allUsers[userId]) {
                    _allUsers[userId].onlineStatus = _usersOnlineStatus[userId];
                    _allUsers[userId].lastOnline =  new Date(_usersOnlineStatus[userId].lastOnline).toString();
                }
                deferred.resolve(_allUsers);


            }, function(err) {
                deferred.reject(err);
            });

            return deferred.promise;
        },
        userOffline: function(userId) {
            var deferred = $q.defer();

            this.getUsers().then(function(allUsers) {
                if (_usersOnlineStatus[userId] == null) {
                    _usersOnlineStatus[userId] = {online: false, lastOnline: _allUsers[userId].lastOnline, currentRoomId: null};

                } else {
                    _usersOnlineStatus[userId].online = false;
                    _usersOnlineStatus[userId].lastOnline = Date.now();
                }

                if (_allUsers[userId]) {
                    _allUsers[userId].onlineStatus = _usersOnlineStatus[userId];
                    _allUsers[userId].lastOnline =  new Date(_usersOnlineStatus[userId].lastOnline).toString();
                }

                deferred.resolve(_allUsers);
            }, function(err) {
                deferred.reject(err);
            });

            return deferred.promise;
        },
        allUserOnlineStatus: function(userObj) {
            var deferred = $q.defer();
            this.getUsers().then(function(allUsers) {
                for (var userId in userObj) {
                    _usersOnlineStatus[userId] = userObj[userId];

                    if (_allUsers[userId]) {
                        _allUsers[userId].onlineStatus = _usersOnlineStatus[userId];

                    }
                }
                deferred.resolve(_usersOnlineStatus);

            }, function(err) {
                deferred.reject(err);
            });

            return deferred.promise;

        },
        setUser: function(user) {
            var deferred = $q.defer();
            this.getUsers().then(function(allUsersArr) {
                if (!_allUsers[user._id]) {
                    _allUsers[user._id] = user;
                    _allUsers[user._id].onlineStatus = _usersOnlineStatus[user._id] != null ? _usersOnlineStatus[user._id] : {online: false, lastOnline: user.lastOnline, currentRoomId: null};
                }
                deferred.resolve(_allUsers[user._id]);

            }, function(err) {
                deferred.reject(err);
            });

            return deferred.promise;
        },
        setUserWithArr: function(userArr) {
            var deferred = $q.defer();
            this.getUsers().then(function(allUsersArr) {
                var temp = [];
                for (var i = 0; i < userArr.length; i++ ){
                    var user = userArr[i];
                    if (!_allUsers[user._id]) {
                        _allUsers[user._id] = user;
                        _allUsers[user._id].online = _usersOnlineStatus[user._id] != null ? _usersOnlineStatus[user._id].online :  _allUsers[user._id].online;
                        _allUsers[user._id].lastOnline = _usersOnlineStatus[user._id] != null ? _usersOnlineStatus[user._id].lastOnline :  _allUsers[user._id].lastOnline;
                    }
                    temp.push(_allUsers[user._id])
                }
                deferred.resolve(temp);
            }, function(err) {
                deferred.reject(err);
            });
            return deferred.promise;
        },
        updateUserStatus: function(userId, status, statusCreated) {
            var deferred = $q.defer();

            this.getUsers().then(function(allUsers) {
                allUsers[userId].status = status;
                allUsers[userId].statusCreated = statusCreated;
                deferred.resolve(allUsers[userId]);
            }, function(err) {
                deferred.reject(err);
            });

            return deferred.promise;
        },

        getThumbnail: function(picUrl) {
            if (!picUrl || picUrl == "" || picUrl == '/img/generic_avatar.gif') return '/img/generic_avatar.gif';
            return picUrl.substring(0, picUrl.lastIndexOf('/')) + '/thumbnails' + picUrl.substring(picUrl.lastIndexOf('/'));
        }
    }
})
