var messageFactory = app.factory('messageFactory', function($http, $q, $rootScope, socket, principal, userFactory) {
    var _currRoom = null, _allRooms = null, _unreadMessages = 0;

    return {
        getRooms: function() {
            var deferred = $q.defer();
            principal.identity().then(function(me) {
                if (_allRooms != null) {
                    deferred.resolve(_allRooms);
                } else {

                    $http({
                        url: '/api/room/all',
                        method: 'GET'
                    }).success(function(data) {
                        _allRooms = {};
                        var userIds = [];
                        var usersToRooms = {};

                        for (var r in data.allRooms) {
                            _allRooms[data.allRooms[r]._id] = data.allRooms[r];

                            var temp = 0;
                            for (var i = 0; i < data.allRooms[r].unreadMessages.length; i++) {
                                if (data.allRooms[r].unreadMessages[i].indexOf('' + me._id) > -1) {
                                    temp = Number(data.allRooms[r].unreadMessages[i].substring(data.allRooms[r].unreadMessages[i].lastIndexOf('.') + 1));
                                    _allRooms[data.allRooms[r]._id].unreadMessages = temp;
                                    break;
                                }
                            }

                            for (var i = 0; i < data.allRooms[r].users.length; i++) {
                                if (data.allRooms[r].users[i] != me._id) {
                                    userIds.push(data.allRooms[r].users[i]);
                                    usersToRooms[data.allRooms[r].users[i]] = data.allRooms[r]._id;
                                }
                            }
                        }

                        userFactory.getUsersByIds(userIds).then(function(usersList) {
                            for (var i = 0; i < usersList.length; i++ ){
                                var user = usersList[i];
                                var roomId = usersToRooms[user._id];
                                if (!_allRooms[roomId].toUserArr) {
                                    _allRooms[roomId].toUserArr = [];
                                }
                                _allRooms[roomId].toUserArr.push(user);
                            }
                            deferred.resolve(_allRooms);

                        });

                    }).error(function(err) {
                        deferred.reject(err);
                    });
                }
            });

            return deferred.promise;

        },
        getRoomId: function(user, siteSocket) {
            var deferred = $q.defer();
            var roomId = null;
            this.getRooms().then(function(response) {
                for (var r in _allRooms) {
                    var temp = _allRooms[r].users;
                    if (temp.length == 2 && temp.indexOf(user._id) > -1) {
                        roomId = r;
                        break;
                    }
                }

                if (roomId) {
                    if (!_allRooms[roomId].toUserArr) _allRooms[roomId].toUserArr = [user];
                    deferred.resolve(_allRooms[roomId]);
                } else {
                    // get new room from api
                    $http({
                        url: '/api/room/user/' + user._id,
                        method: 'GET'
                    }).success(function(data) {
                        _allRooms[data.room._id] = data.room;
                        siteSocket.emit('new:room', {roomId: data.room._id, userId: user._id});
                        for (var i = 0; i < data.room.unreadMessages.length; i++){
                            if (data.room.unreadMessages[i].indexOf(user._id) > -1) {
                                var temp = Number(data.room.unreadMessages[i].substring(data.room.unreadMessages[i].lastIndexOf('.') + 1));
                                _allRooms[data.room._id].unreadMessages = temp;
                            }
                        }
                        var temp = [];

                        principal.identity().then(function(me) {
                            for (var i = 0; i < data.room.users.length; i++ ){
                                var userId = data.room.users[i];
                                if (userId != me._id){
                                    temp.push(userId);
                                }
                            }

                            userFactory.getUsersByIds(temp).then(function(users) {
                                _allRooms[data.room._id] = data.room;
                                _allRooms[data.room._id].toUserArr = users;
                                deferred.resolve(_allRooms[data.room._id]);
                            });
                        });

                    }).error(function(err) {
                        deferred.reject(err);
                    })
                }
            }, function(err) {
                deferred.reject(err);
            });

            return deferred.promise;


        },

        addMessage: function(roomId, message, meId, siteSocket) {
            var deferred = $q.defer();
            var obj = this;

            this.getRooms().then(function(data) {
                obj.getMessages(roomId, meId, siteSocket).then(function(messageArr) {

                    _allRooms[roomId].messageArr.push(message);
                    _allRooms[roomId].lastMessage = message.text;
                    _allRooms[roomId].lastMessageCreated = message.createdAt;

                    if (!_currRoom || _currRoom._id != roomId) {
                        _allRooms[roomId].unreadMessages += 1;
                        _unreadMessages += 1;
                        $rootScope.$emit('updateUnreadMessages', _unreadMessages);
                        deferred.resolve(_allRooms[roomId].messageArr);

                    } else {
                        deferred.resolve(_allRooms[roomId].messageArr);
                    }
                });



            }, function(err) {
                deferred.reject(err);
            });

            return deferred.promise;
        },


        setCurrentRoom: function(roomId, userId, siteSocket) {
            var deferred = $q.defer();
            if (roomId == null) {
                _currRoom = null;
                siteSocket.emit('set:current:room', {roomId: '', userId: null});
                deferred.resolve(_currRoom);
            } else {
                this.getRooms().then(function(data) {
                    _currRoom = _allRooms[roomId];
                    _unreadMessages -= _currRoom.unreadMessages;
                    $rootScope.$emit('updateUnreadMessages', _unreadMessages);

                    _currRoom.unreadMessages = 0;
                    deferred.resolve(_currRoom);
                    siteSocket.emit('set:current:room', {roomId: roomId, userId: userId});
                });
            }
            return deferred.promise;
        },


        getMessages: function(roomId, userId, siteSocket) {
            var deferred = $q.defer();
            var obj = this;

            this.getRooms().then(function(response) {
                if (_allRooms[roomId].messageArr && !_allRooms[roomId].needsUpdate) {
                    deferred.resolve(_allRooms[roomId].messageArr);
                } else {
                    $http({
                        url: '/api/room/' + roomId + '/messages',
                        method: 'GET'
                    }).success(function (data) {
                        if (!_allRooms[roomId].messageArr) {
                            _allRooms[roomId].messageArr = [];
                        }
                        for (var i = 0; i < data.messageArr.length; i++) {
                            _allRooms[roomId].messageArr.push(data.messageArr[i]);
                        }
                        _allRooms[roomId].needsUpdate = false;

                        deferred.resolve(_allRooms[roomId].messageArr);
                    }).error(function (err) {
                        deferred.reject(err);
                    })
                }

            }, function(err) {
                deferred.reject(err);
            });

            return deferred.promise;
        },


        getUnreadMessages: function(meId) {
            var deferred = $q.defer();

            this.getRooms().then(function(data) {
                for (var r in _allRooms) {
                    var room = _allRooms[r];
                    _unreadMessages += room.unreadMessages;
                }
                deferred.resolve(_unreadMessages);
            });
            return deferred.promise;
        },
        addRoom: function(roomId) {
            var deferred = $q.defer();
            $http({
                url: '/api/room/' + roomId,
                method: 'GET'
            }).success(function(data) {

                var room = data.room;
                var temp = [];
                principal.identity().then(function(me) {
                    for (var i = 0; i < room.users.length; i++ ){
                        var userId = room.users[i];
                        if (userId != me._id){
                            temp.push(userId);
                        }
                    }

                    userFactory.getUsersByIds(temp).then(function(users) {
                        _allRooms[room._id] = room;
                        _allRooms[room._id].toUserArr = users;
                        _allRooms[room._id].messageArr = [];
                        deferred.resolve(_allRooms[room._id]);

                    });
                });


            }).error(function(err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }
    }
})
