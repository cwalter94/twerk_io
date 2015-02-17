var app = angular.module('twerkApp', ['ui.utils', 'angular-loading-bar', 'ngAnimate', 'ui.select', 'angularFileUpload', 'ui.bootstrap',
    'mgcrea.ngStrap', 'xeditable', 'angular-flash.service', 'angular-flash.flash-alert-directive', 'ui.router', 'ngCookies',
    'btford.socket-io', 'once', 'infinite-scroll', 'luegg.directives', 'textAngular'], function () {

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
                                return null;
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
                controller: 'authCtrl'
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
                controller: function($scope, $http, flash, sendEmailFn, principal, $state) {
                    $scope.sendEmail = sendEmailFn;
                    $scope.verify = {code: ""};

                    $scope.verifyCode = function() {
                        $http({
                            url: '/api/verify/confirm',
                            method: 'GET',
                            params: {
                                code: $scope.verify.code
                            }
                        }).then(function(response) {
                                principal.identity().then(function (identity) {
                                    principal.verifyIdentity(identity);
                                    flash.success = 'Account successfully verified.';
                                    $scope.verified = true;
                                    $state.transitionTo('site.auth.browse');
                                });
                            }
                            , function(err) {
                                console.log($scope.code);
                                console.log(err);
                                $scope.verified = false;
                                flash.error = 'An error occurred in verification. Please try again later.'
                            })
                    }
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
                abstract: true,
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
                    allRooms: ['messageFactory', function(messageFactory) {
                        return messageFactory.getRooms().then(function(allRooms) {
                            return allRooms;
                        });
                    }],
                    usersObj: ['userFactory', 'allRooms', function(userFactory, allRooms) {
                        return userFactory.getUsers().then(function(allUsers) {
                            return allUsers;
                        });
                    }],
                    currRoom: ['messageFactory', 'siteSocket', function(messageFactory, siteSocket) {
                       return messageFactory.setCurrentRoom(null, null, siteSocket).then(function(room) {
                            return null;
                        }, function(err) {
                            return null;
                        });
                    }],
                    groups: ['groupFactory', function(groupFactory) {
                        return groupFactory.getGroups().then(function(groups) {
                            return groups;
                        }, function(err) {
                            console.log(err);
                            return null;
                        })
                    }]
                }
            })
            .state('site.auth.browse.all', {
                url: '',
                controller: 'groupCtrl',
                templateUrl: '/partials/inner/browse/group'
            })
            .state('site.auth.browse.group', {
                url: '/{url}',
                controller: 'groupCtrl',
                templateUrl: '/partials/inner/browse/group',
                resolve: {
                    groupPosts: ['groupFactory', '$stateParams', function(groupFactory, $stateParams) {
                        return groupFactory.getGroupPosts($stateParams.name).then(function(response) {
                            return response.groupPosts;
                        }, function(err) {
                            console.log(err);
                            return null;
                        });
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
                    var deferred = $q.defer();
                    _identity = newIdentity;
                    deferred.resolve(_identity);
                    return deferred.promise;
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
    .factory('messageFactory', function($http, $q, $rootScope, socket, principal, userFactory) {
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
    .factory('userFactory', function($http, $q) {
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
            }
        }
    })
    .filter('browseFilter', function () {

        return function (users, search, currentClassFilter) {
            if (search == null && currentClassFilter == "") {
                var resultArr = [];

                for (var key in users) {
                    resultArr.push(users[key]);
                }
                return resultArr;
            }

            var results = {};
            var resultsArr = [];

            for (var u in users) {
                var user = users[u];
                if (currentClassFilter){
                    if (user.classes.indexOf(currentClassFilter) > -1) {
                        results[user._id] = user;
                    }
                } else if (!currentClassFilter && search != null) {
                    var searchStrings = search.split(', ');

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
    .filter('roomFilter', function() {
        return function (rooms, search) {
            var results = [];
            for (var r in rooms) {
                if (rooms[r].selected || rooms[r].messages.length > 0 || rooms[r].messageArr && rooms[r].messageArr.length > 0) {
                    results.push(rooms[r]);
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