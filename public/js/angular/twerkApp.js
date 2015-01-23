var app = angular.module('twerkApp', ['ui.utils', 'angular-loading-bar', 'ngAnimate', 'ui.select', 'angularFileUpload', 'ui.bootstrap',
    'mgcrea.ngStrap', 'xeditable', 'angular-flash.service', 'angular-flash.flash-alert-directive', 'ui.router', 'ngCookies', 'smart-table',
    'btford.socket-io', 'once', 'infinite-scroll', 'luegg.directives'], function () {

})
    .config(function (uiSelectConfig, flashProvider, $httpProvider, $stateProvider, $urlRouterProvider, $locationProvider, cfpLoadingBarProvider) {

        uiSelectConfig.theme = 'selectize';
        $locationProvider.html5Mode(true).hashPrefix('!');
        $httpProvider.interceptors.push('authInterceptor');
        flashProvider.errorClassnames.push('alert-danger');
        flashProvider.successClassnames.push('alert-success');
        cfpLoadingBarProvider.latencyThreshold = 50;

        $stateProvider.state('site', {
            abstract: true,
            templateUrl: '/partials/outer/index',
            controller: 'siteCtrl',
            url: '',
            resolve: {

                siteSocket: ['socket', function(socket) {
                    return socket.getSocket().then(function(s) {
                        return s;
                    }, function(err) {
                        return null;
                    })
                }],
                me: ['principal', '$location', '$state',
                    function (principal, $location, $state) {
                        return principal.identity().then(function(identity) {
                            //if (identity != null) {
                            //    $location.path('/browse');
                            //}
                            return identity;
                        }, function(err) {
                            return null;
                        });
                    }
                ]
            }
        })
            .state('site.home', {
                templateUrl: '/partials/outer/home',
                resolve: {
                    me: ['principal', '$location', '$state',
                        function (principal, $location, $state) {
                            return principal.identity().then(function(identity) {
                                if (identity != null) {
                                    $state.transitionTo('site.auth.browse');
                                }
                                return identity;
                            }, function(err) {
                                return null;
                            });
                        }
                    ]
                },
                controller: function ($scope) {

                },
                url: '/',
                abstract: true

            })
            .state('site.home.intro', {
                url: '',
                templateUrl: '/partials/inner/home/intro'
            })

            .state('site.home.login', {
                url: 'login',
                templateUrl: '/partials/outer/login',
                controller: 'loginCtrl'
            })


            .state('site.home.register', {
                url: 'register',
                abstract: true,
                templateUrl: '/partials/outer/register',
                controller: 'registerCtrl'
            })
            .state('site.home.register.email', {
                url: '/email',
                templateUrl: '/partials/inner/register/form-email'
            })
            .state('site.home.register.name', {
                url: '/name',
                templateUrl: '/partials/inner/register/form-name'
            })
            .state('site.home.register.password', {
                url: '/password',
                templateUrl: '/partials/inner/register/form-password'
            })
            .state('site.home.register.repassword', {
                url: '/repassword',
                templateUrl: '/partials/inner/register/form-repassword'
            })




            .state('site.auth', {
                abstract: true,
                templateUrl: '/partials/outer/auth',
                resolve: {
                    me: ['principal', '$location', '$state',
                        function (principal, $location, $state) {
                            return principal.identity().then(function(identity) {
                               return identity;
                            }, function(err) {
                                $location.path('/login');
                            });
                        }
                    ],
                    siteSocket: ['socket', function(socket) {
                        return socket.getSocket().then(function(s) {
                            return s;
                        }, function(err) {
                            return null;
                        })
                    }],
                    allRooms: ['messageFactory', function(messageFactory) {
                        return messageFactory.getRooms().then(function(allRooms) {
                            return allRooms;
                        });
                    }]
                },
                controller: function($scope, $state, $rootScope, me, siteSocket, userFactory, messageFactory, allRooms) {

                    siteSocket.emit('user:init', me._id);
                    var temp = [];
                    for (var r in allRooms) {
                        temp.push(r);
                    }

                    siteSocket.emit('join:room:arr', temp);
                    messageFactory.getUnreadMessages(me._id).then(function(unreadMessages) {
                        $rootScope.$emit('updateUnreadMessages', unreadMessages);
                    });

                    siteSocket.on('user:offline', function(userId) {
                        userFactory.userOffline(userId).then(function(data) {

                        }, function(err) {

                        })
                    });

                    siteSocket.on('user:online', function(userId) {
                        userFactory.userOnline(userId).then(function(data) {

                        }, function(err) {

                        })
                    });

                    siteSocket.on('user:init', function(userOnlineStatus) {

                        userFactory.allUserOnlineStatus(userOnlineStatus);
                    });

                    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, err) {
                        if (toState.name.indexOf('site.auth.messages.room') == -1) {
                            messageFactory.setCurrentRoom(null).then(function(currRoom) {
                                siteSocket.emit('set:current:room', {roomId: "", userId: me._id});
                            });
                        }
                    });

                    siteSocket.on('send:message', function(message) {
                        messageFactory.addMessage(message.to, message, me._id);
                    });



                }
            })
            .state('site.auth.verify', {
                url: '/verify',
                templateUrl: '/partials/outer/verify',
                resolve: {
                    sendEmailFn: ['$http', 'flash', function($http, flash) {
                        return function() {
                            $http.get('api/verify/send')
                                .success(function (data) {
                                    flash.success = 'An email was sent to '  + data.email + '.';
                                })
                                .error(function (err) {
                                    flash.error = err;
                                });
                        }

                    }],
                    me: ['principal', '$location', '$state',
                        function (principal, $location, $state) {
                            return principal.identity().then(function(identity) {
                                return identity;
                            }, function(err) {
                                $location.path('/login');
                            });
                        }


                    ]

                },
                controller: function($scope, $http, flash, sendEmailFn) {
                    $scope.sendEmail = sendEmailFn;

                }
            })
            .state('site.auth.verify.confirm', {
                url: '/:code',
                templateUrl: '/partials/outer/verifyconfirm',
                resolve: {
                    me: ['principal', '$location', '$state',
                        function (principal, $location, $state) {
                            return principal.identity().then(function(identity) {
                                return identity;
                            }, function(err) {
                                $location.path('/login');
                            });
                        }


                    ],
                    verified: ['$http', 'principal', '$stateParams', function($http, principal, $stateParams) {

                        return $http({
                            url: '/api/verify/confirm',
                            method: 'GET',
                            params: {
                                code: $stateParams.code
                            }
                        }).then(function(response) {
                                return principal.identity().then(function (identity) {
                                    principal.verifyIdentity(identity);
                                    return true;
                                });
                            }
                            , function(err) {
                                console.log(err);
                                return false;
                            })
                    }]

                },
                controller: function($scope, verified, sendEmailFn) {
                    $scope.verified = verified;
                    $scope.sendEmail = sendEmailFn;

                }
            })

            .state('site.auth.profile', {
                url: '/profile',
                templateUrl: '/partials/outer/profile',
                controller: 'accountCtrl',
                resolve: {
                    me: ['principal', '$location', '$state',
                        function (principal, $location, $state) {
                            return principal.identity().then(function(identity) {
                                if (!identity.verified) {
                                    $state.transitionTo('site.auth.verify');
                                }
                                return identity;
                            }, function(err) {
                                $location.path('/login');
                            });
                        }


                    ]
                }
            })


            .state('site.auth.dashboard', {
                url: '/dashboard',
                templateUrl: '/partials/outer/dashboard',
                abstract: true
            })
            .state('site.auth.dashboard.users', {
                url: '/users',
                controller: 'dashboardCtrl',

                templateUrl: '/partials/inner/dashboard/users',
                resolve: {
                    users: ['$http', function ($http) {
                        return $http.get('/api/admin/allusers')
                            .then(function (response) {
                                return response.data.users;
                            });
                    }],
                    me: ['principal', '$location', '$state',
                        function (principal, $location, $state) {
                            return principal.identity().then(function(identity) {
                                if (!identity.verified) {
                                    $state.transitionTo('site.auth.verify');
                                }
                                return identity;
                            }, function(err) {
                                $location.path('/login');
                            });
                        }


                    ]
                }
            })

            .state('site.auth.messages', {
                url: '/messages',
                controller: 'messagesCtrl',
                templateUrl: '/partials/outer/messages',
                resolve: {
                    me: ['principal', '$location', '$state',
                        function (principal, $location, $state) {
                            return principal.identity().then(function(identity) {
                                if (!identity.verified) {
                                    $state.transitionTo('site.auth.verify');
                                }
                                return identity;
                            }, function(err) {
                                $location.path('/login');
                            });
                        }
                    ]
                }
            })
            .state('site.auth.messages.room', {
                url: '/{roomId}',
                templateUrl: '/partials/inner/messages/room',
                controller: 'roomCtrl',
                resolve: {
                    me: ['principal', '$location', '$state',
                        function (principal, $location, $state) {
                            return principal.identity().then(function(identity) {
                                if (!identity.verified) {
                                    $state.transitionTo('site.auth.verify');
                                }
                                return identity;
                            }, function(err) {
                                $location.path('/login');
                            });
                        }
                    ],
                    siteSocket: ['socket', function(socket) {
                        return socket.getSocket().then(function(s) {
                            return s;
                        }, function(err) {
                            return null;
                        })
                    }],
                    messages: ['messageFactory', '$stateParams', 'me', 'siteSocket',
                        function(messageFactory, $stateParams, me, siteSocket) {
                            return messageFactory.getMessages($stateParams.roomId, me._id, siteSocket).then(function(data) {
                                return data;
                            }, function(err) {
                                return null;
                            })
                    }]


                }
            })


            .state('site.auth.browse', {
                url: '/browse',
                templateUrl: '/partials/outer/browse',
                controller: 'browseCtrl',
                resolve: {
                    me: ['principal', '$location', '$state',
                        function (principal, $location, $state) {
                            return principal.identity().then(function(identity) {
                                if (identity && !identity.verified) {
                                    $state.transitionTo('site.auth.verify');
                                }
                                return identity;
                            }, function(err) {
                                $location.path('/login');
                                return null;
                            });
                        }
                    ],
                    users: ['userFactory', function(userFactory) {
                        return userFactory.getUsers().then(function(allUsers) {
                            return allUsers;
                        });
                    }],
                    usersObj: ['userFactory', function(userFactory) {
                        return userFactory.getUsersObj().then(function(obj) {
                            return obj;
                        })
                    }]
                }
            });


        $urlRouterProvider.otherwise('/');

    }).constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    })
    .constant('USER_ROLES', {
        all: '*',
        admin: 'admin',
        editor: 'editor',
        guest: 'guest'
    })

    .factory('principal', ['$q', '$http', '$timeout', '$window', '$cookieStore', '$state',
        function ($q, $http, $timeout, $window, $cookieStore, $state, socket) {

            var _identity = undefined,
                _authenticated = false,
                _verified = false;

            return {
                isIdentityResolved: function () {
                    return angular.isDefined(_identity);
                },

                isAuthenticated: function () {
                   return _authenticated;

                },

                isVerified: function() {
                    if (angular.isDefined(_identity)) return _identity.verified || false;
                    return false;
                },

                isInRole: function (role) {

                    if (!_authenticated || (!angular.isUndefined(_identity) && !_identity.roles)) return false;

                    return _identity.roles.indexOf(role) != -1;
                },
                isInAnyRole: function (roles) {
                    if (!_authenticated || !_identity.roles) return false;

                    for (var i = 0; i < roles.length; i++) {
                        if (this.isInRole(roles[i])) return true;
                    }

                    return false;
                },
                authenticate: function (identity) {
                    _identity = identity;
                    _authenticated = identity != null;
                },
                identity: function (force) {
                    var deferred = $q.defer();

                    if (force === true) _identity = undefined;
                    // check and see if we have retrieved the identity data from the server. if we have, reuse it by immediately resolving
                    if (angular.isDefined(_identity)) {
                        deferred.resolve(_identity);
                    }
                    else {

                        $http.get('/api/user')
                            .success(function (data) {
                                _identity = data.user;
                                $cookieStore.put('jwt', data.token);
                                _authenticated = true;
                                deferred.resolve(_identity);
                            })
                            .error(function (err) {
                                _identity = null;
                                _authenticated = false;
                                deferred.reject(err);
                            });

                    }
                    return deferred.promise;

                },
                updateIdentity: function (newIdentity) {
                  _identity = newIdentity;
                },
                login: function (credentials) {
                    var deferred = $q.defer();


                    $http.post('/authenticate', {credentials: credentials})
                        .success(function (data) {
                            _identity = data.user;
                            $cookieStore.put('jwt', data.token);
                            _authenticated = true;
                            deferred.resolve(_identity);

                        })
                        .error(function (err) {
                            _identity = undefined;
                            _authenticated = false;
                            $cookieStore.put('jwt', null);
                            deferred.reject(err);
                        });

                    return deferred.promise;
                },

                logout: function () {
                    var deferred = $q.defer();

                    $http.get('/api/logout')
                        .success(function (data) {
                            _identity = undefined;
                            $cookieStore.put('jwt', null);
                            $cookieStore.put('username', null);
                            _authenticated = false;
                            deferred.resolve(_identity);
                        })
                        .error(function (err) {
                            _identity = undefined;
                            _authenticated = false;
                            $cookieStore.put('jwt', null);
                            $cookieStore.put('username', null);
                            socket.emit('disconnect', {});
                            deferred.reject(err);
                        });
                    return deferred.promise;
                },
                register: function (formData) {
                    var deferred = $q.defer();


                    $http.post('/register', formData)
                        .success(function (data) {
                            _identity = data.user;
                            $cookieStore.put('jwt', data.token);
                            _authenticated = true;
                            deferred.resolve(_identity);
                        })
                        .error(function (err) {
                            _identity = undefined;
                            _authenticated = false;
                            $cookieStore.put('jwt', null);
                            deferred.reject(err);
                        });

                    return deferred.promise;
                },
                sendMessage: function (message) {
                    var deferred = $q.defer();


                    $http.post('/api/user/messages/' + message.to, message)
                        .success(function (data) {
                            _identity = data.user;
                            $cookieStore.put('jwt', data.token);
                            _authenticated = true;
                            deferred.resolve(data.message);
                        })
                        .error(function (err) {
                            _identity = null;
                            _authenticated = false;
                            $cookieStore.put('jwt', null);
                            deferred.reject(err);
                        });

                    return deferred.promise;
                },
                verifyIdentity: function(temp) {
                    if (temp === _identity) {
                        _identity.verified = true;
                    }
                }
            };
        }
    ])
    .factory('authorization', ['$rootScope', '$state', 'principal',
        function ($rootScope, $state, principal) {
            return {
                authorize: function () {
                        return principal.isAuthenticated();
                }
            };
        }
    ])
    .factory('authInterceptor', function ($rootScope, $q, $cookieStore, $location) {
        return {
            request: function (config) {
                if (config.url.indexOf('http://maps.googleapis.com/maps/api/geocode/json?') > -1
                || config.url.indexOf('apis-dev.berkeley.edu') > -1) return config;

                config.headers = config.headers || {};

                if ($cookieStore.get('jwt')) {
                    config.headers.Authorization = 'Bearer ' + $cookieStore.get('jwt');
                }
                return config;
            },
            response: function (response) {
                if (response.status === 401) {

                }

                if (response.token != null) {
                    $cookieStore.set('jwt', response.token);
                }
                return response || $q.when(response);
            }
        };
    })
    .factory('socket', function ($q, socketFactory, $cookieStore) {
        var _mySocket = null;

        return {

            getSocket: function() {
                var deferred = $q.defer();

                if (_mySocket != null) {
                    deferred.resolve(_mySocket);
                }
                else if ($cookieStore.get('jwt')) {

                    var authSocket = io.connect('', {
                        query: 'token=' + $cookieStore.get('jwt')
                    });

                    _mySocket = socketFactory({
                        ioSocket: authSocket
                    });

                    deferred.resolve(_mySocket);

                } else {
                    deferred.reject("Socket auth failed");
                }
                return deferred.promise;
            }
        }

    })
    .factory('messageFactory', function($http, $q, $rootScope, socket, principal) {
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
                            }
                            deferred.resolve(_allRooms);
                        }).error(function(err) {
                            deferred.reject(err);
                        });
                    }
                });

                return deferred.promise;

            },

            getRoomToUsers: function(roomId, me) {
                var deferred = $q.defer();
                this.getRooms().then(function(response) {


                    if (_allRooms[roomId].toUserArr) {
                        deferred.resolve(_allRooms[roomId].toUserArr);
                    } else {
                        var temp = [];
                        for (var u in _allRooms[roomId].users) {

                            if (_allRooms[roomId].users[u] !== me._id) {
                                temp.push(_allRooms[roomId].users[u]);
                            }
                        }

                        $http({
                            url: '/api/users',
                            method: 'GET',
                            params: {
                                userIds: temp
                            }
                        }).success(function (data) {
                            _allRooms[roomId].toUserArr = data.users;
                            deferred.resolve(_allRooms[roomId].toUserArr);
                        }).error(function (err) {
                            deferred.reject(err);
                        })
                    }


                }, function(err) {
                   deferred.reject(err);
                });
                return deferred.promise;
            },

            getRoomId: function(user) {
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
                            console.log("NEW ROOM UNREAD MESSAGES", data.room.unreadMessages);
                            for (var i = 0; i < data.room.unreadMessages.length; i++){
                                console.log("NEW ROOM USER ID", user._id);
                                console.log("NEW ROOM INDEX OF USER ID", data.room.unreadMessages[i].indexOf(user._id));
                                if (data.room.unreadMessages[i].indexOf(user._id) > -1) {
                                    var temp = Number(data.room.unreadMessages[i].substring(data.room.unreadMessages[i].lastIndexOf('.') + 1));
                                    _allRooms[data.room._id].unreadMessages = temp;
                                }
                            }
                            deferred.resolve(_allRooms[data.room._id]);
                        }).error(function(err) {
                            deferred.reject(err);
                        })
                    }
                }, function(err) {
                    deferred.reject(err);
                });

                return deferred.promise;


            },

            getMultipleRoomsToUsers: function(roomIds, me) {
                var deferred = $q.defer();
                var usersToRooms = {};
                var result = {}; //map roomId to toUserArr

                this.getRooms().then(function(response) {
                    var neededUserIds = [];

                    for (var r in roomIds) {
                        var roomId = roomIds[r];

                        if (_allRooms[roomId].toUserArr) {
                            result[roomId] = _allRooms[roomId].toUserArr;
                        } else {
                            for (var u in _allRooms[roomId].users) {
                                if (_allRooms[roomId].users[u] != me._id) {
                                    neededUserIds.push(_allRooms[roomId].users[u]);
                                    usersToRooms[_allRooms[roomId].users[u]] = roomId;
                                }
                            }
                        }
                    }

                    if (neededUserIds.length > 0) {
                        $http({
                            url: '/api/users',
                            method: 'GET',
                            params: {
                                userIds: neededUserIds
                            }
                        }).success(function(data) {
                            for (var u in data.users) {
                                var user = data.users[u];
                                if (!_allRooms[usersToRooms[user._id]].toUserArr) {
                                    _allRooms[usersToRooms[user._id]].toUserArr = [];
                                }
                                if (!result[usersToRooms[user._id]]) {
                                    result[usersToRooms[user._id]] = [];
                                }
                                _allRooms[usersToRooms[user._id]].toUserArr.push(user);
                                result[usersToRooms[user._id]].push(user);
                            }

                            deferred.resolve(result);
                        }).error(function(err) {
                            deferred.reject(err);
                        })
                    }
                });
                return deferred.promise;

            },

            addMessage: function(roomId, message, meId) {
                var deferred = $q.defer();

                this.getRooms().then(function(data) {

                    if (angular.isUndefined(_allRooms[roomId].messageArr)) {
                        _allRooms[roomId].messageArr = [];
                        _allRooms[roomId].needsUpdate = true;
                    }
                    _allRooms[roomId].messageArr.push(message);
                    _allRooms[roomId].lastMessage = message.text;
                    _allRooms[roomId].lastMessageCreated = message.created;

                    if (!_currRoom || _currRoom._id != roomId) {
                        _allRooms[roomId].unreadMessages += 1;

                        _unreadMessages += 1;
                        $rootScope.$emit('updateUnreadMessages', _unreadMessages);

                    }
                    deferred.resolve(_allRooms[roomId].messageArr);
                }, function(err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            },


            setCurrentRoom: function(roomId, userId, siteSocket) {
                var deferred = $q.defer();
                if (roomId == null) {
                    _currRoom = null;
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
                    obj.setCurrentRoom(roomId, userId, siteSocket).then(function(response) {
                        if (_allRooms[roomId].messageArr && !_allRooms[roomId].needsUpdate) {
                            deferred.resolve(_allRooms[roomId].messageArr);
                        } else {
                            $http({
                                url: '/api/room/' + roomId + '/messages',
                                method: 'GET'
                            }).success(function(data) {
                                _allRooms[roomId].messageArr = data.messageArr;
                                _allRooms[roomId].needsUpdate = false;
                                deferred.resolve(_allRooms[roomId].messageArr);
                            }).error(function(err) {
                                deferred.reject(err);
                            })
                        }
                    });

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
            }
        }
    })
    .factory('userFactory', function($http, $q) {
        var _allUsers = null, _allUsersArr = [], _sortBy = 'lastOnline', _usersOnlineStatus = {};

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
                        if (!_allUsers) _allUsers = {};

                        for (var u in data.users) {
                            var user = data.users[u];
                            _allUsers[user._id] = user;
                            _allUsers[user._id].online = _usersOnlineStatus[user._id] != null ? _usersOnlineStatus[user._id].online :  _allUsers[user._id].online;
                            _allUsers[user._id].lastOnline = _usersOnlineStatus[user._id] != null ? _usersOnlineStatus[user._id].lastOnline :  _allUsers[user._id].lastOnline;
                            _allUsersArr.push(_allUsers[user._id]);
                        }
                        _allUsersArr.sort(function(a, b) {
                            return a[_sortBy] - b[_sortBy];
                        });
                        deferred.resolve(_allUsersArr);

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
                            if (!_allUsers[user._id]) {
                                _allUsersArr.push(user);
                            }
                            _allUsers[user._id] = user;
                        }
                        _allUsersArr.sort(function(a, b) {
                            return a[_sortBy] - b[_sortBy];
                        });
                        deferred.resolve(_allUsersArr);
                    }).error(function(err) {
                        deferred.reject(err);
                    })
                }, function(err) {
                    deferred.reject(err);
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
                    if (_allUsers[userId]) {
                        _allUsers[userId].online = true;
                        _allUsers[userId].lastOnline = Date.now();
                    } else {
                        _usersOnlineStatus[userId] = {online: true, lastOnline: Date.now()};
                    }

                    deferred.resolve(_allUsersArr);
                }, function(err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            },
            userOffline: function(userId) {
                var deferred = $q.defer();

                this.getUsers().then(function(allUsers) {
                    if (_allUsers[userId]) {
                        _allUsers[userId].online = false;
                        _allUsers[userId].lastOnline = Date.now();
                    } else {
                        _usersOnlineStatus[userId] = {online: false, lastOnline: Date.now()};
                    }
                }, function(err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            },
            allUserOnlineStatus: function(userObj) {
                var deferred = $q.defer();
                this.getUsers().then(function(allUsers) {
                    for (var userId in userObj) {
                        if (_allUsers[userId]) {
                            _allUsers[userId].online = userObj[userId].online;
                            _allUsers[userId].lastOnline = userObj[userId].lastOnline;
                        } else {
                            _usersOnlineStatus[userId] = userObj[userId];
                        }
                    }

                }, function(err) {
                    deferred.reject(err);
                });

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
            }
        }
    })
    .filter('browseFilter', function () {

        return function (users, search) {
            if (search == null) return users;
            var results = {};
            var resultsArr = [];

            for (var u in users) {
                var user = users[u];
                var searchStrings = search.split(', ');
                var returnUser = false;

                var userString = user.name + ' ' + user.status;
                if (user.classes && user.classes.length > 0) {
                    userString += ' ' + user.classes.join(' ');
                }

                for (var i in searchStrings) {
                    if (userString.toLowerCase().indexOf(searchStrings[i].toLowerCase()) > -1) {
                        results[user._id] = user;
                    }
                }
            }

            for (var key in results) {
                resultsArr.push(results[key]);
            }


            return resultsArr;

        }
    })
    .filter('classFilter', function () {
        return function (classes, search) {
            if (search == null) return classes;
            var results = [];
            for (var c in classes) {
                var tempClass = classes[c];
                // no UID = class was added manually - necessary to see saved classes
                if (!tempClass['classUID']) {
                    results.push(tempClass);
                } else {
                    var classString = (tempClass.departmentCode + ' ' + tempClass.courseNumber).toLowerCase();
                    var regExp = /([^\d\s]+)\s*(\d{1,3}\D{0,2})/;
                    var match = regExp.exec(search);
                    if (match) {
                        if ((match[1] == 'CS' || classString.indexOf(match[1].toLowerCase()) > -1) && classString.indexOf(match[2].toLowerCase()) > -1) {

                            results.push(tempClass);
                        }
                    }
                }


            }
            return results;
        }
    })

    .run(['$rootScope', '$state', '$stateParams', 'authorization', 'principal', 'editableOptions',
        function ($rootScope, $state, $stateParams, authorization, principal, editableOptions) {
            editableOptions.theme = 'bs3';

            $rootScope.$on('$stateChangeStart', function (event, toState, toStateParams) {
                // track the state the user wants to go to; authorization service needs this

                $rootScope.toState = toState;
                $rootScope.toStateParams = toStateParams;
                // if the principal is resolved, do an authorization check immediately. otherwise,
                // it'll be done when the state it resolved.

                if (principal.isIdentityResolved()) authorization.authorize();

            });
        }
    ]);