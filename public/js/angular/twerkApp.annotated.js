var app = angular.module('twerkApp', ['ui.utils', 'angular-loading-bar', 'ngAnimate', 'ui.select', 'angularFileUpload', 'ui.bootstrap',
    'mgcrea.ngStrap', 'xeditable', 'angular-flash.service', 'angular-flash.flash-alert-directive', 'ui.router', 'ngCookies', 'smart-table',
    'btford.socket-io', 'once', 'infinite-scroll', 'luegg.directives'], function () {

})
    .config(['uiSelectConfig', 'flashProvider', '$httpProvider', '$stateProvider', '$urlRouterProvider', '$locationProvider', 'cfpLoadingBarProvider', function (uiSelectConfig, flashProvider, $httpProvider, $stateProvider, $urlRouterProvider, $locationProvider, cfpLoadingBarProvider) {

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
                }]
            }
        })
            .state('site.home', {
                templateUrl: '/partials/outer/home',
                resolve: {
                    me: ['principal', '$location', '$state',
                        function (principal, $location, $state) {
                            return principal.identity().then(function(identity) {
                                //if (identity != null) {
                                //    $location.path('/browse');
                                //}
                                return identity;
                            }, function(err) {
                                $location.path('/login');
                            });
                        }
                    ]
                },
                controller: ['$scope', function ($scope) {

                }],
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
                    }]
                },
                controller: ['$scope', '$state', 'me', 'siteSocket', 'userFactory', function($scope, $state, me, siteSocket, userFactory) {

                    siteSocket.emit('user:init', me._id);

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
                }]
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
                controller: ['$scope', '$http', 'flash', 'sendEmailFn', function($scope, $http, flash, sendEmailFn) {
                    $scope.sendEmail = sendEmailFn;

                }]
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
                controller: ['$scope', 'verified', 'sendEmailFn', function($scope, verified, sendEmailFn) {
                    $scope.verified = verified;
                    $scope.sendEmail = sendEmailFn;

                }]
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


                    ],
                    allRooms: ['messageFactory', function(messageFactory) {
                        return messageFactory.getRooms().then(function(data) {
                            return data;
                        }, function(err) {
                            console.log(err);
                        })
                    }]
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
                    messages: ['messageFactory', '$stateParams',
                        function(messageFactory, $stateParams) {
                            return messageFactory.getMessages($stateParams.roomId).then(function(data) {
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
                    }]
                }
            });


        $urlRouterProvider.otherwise('/');

    }]).constant('AUTH_EVENTS', {
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
    .factory('authInterceptor', ['$rootScope', '$q', '$cookieStore', '$location', function ($rootScope, $q, $cookieStore, $location) {
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
    }])
    .factory('socket', ['$q', 'socketFactory', '$cookieStore', function ($q, socketFactory, $cookieStore) {
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

    }])
    .factory('messageFactory', ['$http', '$q', function($http, $q) {
        var _currRoom = null, _allRooms = null;

        return {
            getRooms: function() {
                var deferred = $q.defer();
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
                        }
                        deferred.resolve(_allRooms);
                    }).error(function(err) {
                        deferred.reject(err);
                    });
                }
                return deferred.promise;

            },
            getMessages: function(roomId) {
                var deferred = $q.defer();

                this.getRooms().then(function(response) {
                    if (_allRooms[roomId].messageArr && _allRooms[roomId].needsUpdate == false) {
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

                }, function(err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            },

            getRoomToUsers: function(roomId, me) {
                var deferred = $q.defer();
                this.getRooms().then(function(response) {
                    var temp = [];
                    for (var u in _allRooms[roomId].users) {

                        if (_allRooms[roomId].users[u] !== me._id) {
                            temp.push(_allRooms[roomId].users[u]);
                        }
                    }

                    if (_allRooms[roomId].toUserArr) {
                        deferred.resolve(_allRooms[roomId].toUserArr);
                    } else {
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
                        if (temp.length == 2 && temp.indexOf(user.id) > -1) {
                            roomId = r;
                            break;
                        }
                    }

                    if (roomId) {
                        if (!_allRooms[roomId].toUserArr) _allRooms[roomId].toUserArr = [user];
                        deferred.resolve(roomId);
                    } else {
                        // get new room from api
                        $http({
                            url: '/api/room/user/' + user._id,
                            method: 'GET'
                        }).success(function(data) {
                            _allRooms[data.room._id] = data.room;
                            _allRooms[data.room._id].needsUpdate = false;
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

            addMessage: function(roomId, message) {
                var deferred = $q.defer();

                this.getRooms().then(function(data) {
                    _allRooms[roomId].messageArr.push(message);
                    _allRooms[roomId].lastMessage = message.text;
                    _allRooms[roomId].lastMessageCreated = message.created;
                    deferred.resolve(_allRooms[roomId].messageArr);
                }, function(err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            }
        }
    }])
    .factory('userFactory', ['$http', '$q', function($http, $q) {
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

            }
        }
    }])
    .filter('browseFilter', function () {

        return function (users, search) {
            if (search == null) return users;
            var results = {};
            var resultsArr = [];

            for (var u in users) {
                var user = users[u];
                var searchStrings = search.split(', ');
                var returnUser = false;

                var userString = user.name + ' ' + user.status + user.classes.join(' ');

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
var aboutCtrl = app.controller('aboutCtrl', ['$scope', '$http', '$upload', 'excomm', 'authorize', 'flash', function($scope, $http, $upload, excomm, authorize, flash) {

    $scope.data = {
        excomm: excomm
    };

    $scope.user = {
    };

    $scope.authorize = authorize;

    $scope.showSuccess = function() {

    };


    $scope.editButton = true;
    $scope.data.excomm = excomm;

}]);
var accountCtrl = app.controller('accountCtrl', ['$scope', '$upload', '$http', '$location', 'me', 'flash', '$cookieStore', 'principal', function($scope, $upload, $http, $location, me, flash, $cookieStore, principal) {

    $scope.me = me;
    console.log($scope.me);

    $scope.me.selectedClasses = [];

    $scope.allClasses = [];
    $scope.loadingClasses = [{departmentCode: 'Loading classes...', courseNumber: ''}];

    for (var i in me.classes) {
        var temp = me.classes[i];
        var newClass = {
            departmentCode: temp.substring(0, temp.lastIndexOf(' ')),
            courseNumber : temp.substring(temp.lastIndexOf(' ') + 1)
        };
        $scope.allClasses.push(newClass);
        $scope.me.selectedClasses.push(newClass);
    }
    $scope.origMe = angular.copy($scope.me);
    $scope.initialComparison = !angular.equals($scope.me, $scope.origMe);
    $scope.dataHasChanged = angular.copy($scope.initialComparison);

    $scope.dropSupported = true;
    $scope.disabled = undefined;

    $scope.search = "";

    $scope.$watch('me', function(newval, oldval) {
       if (newval != oldval) {
           $scope.dataHasChanged = !angular.equals($scope.me, $scope.origMe);
       }
    }, true);

    $scope.getClasses = function(search) {
            if (search.length > 1) {
                $scope.search = search;
                var date = new Date();
                var term = 'Spring';
                var regExp = /([^\d\s]+)\s*(\d{1,3}\D{0,2})/;
                var match = regExp.exec(search);
                if (date.getMonth() > 5 || date.getMonth() == 5 && date.getDate() > 20) {
                    if (date.getMonth() > 8 || date.getMonth() == 8 && date.getDate() > 15) {
                        term = 'Fall';
                    } else {
                        term = 'Summer';
                    }
                }
                if (match && match[2]) {

                    $http({
                        url: 'https://apis-dev.berkeley.edu/cxf/asws/classoffering',
                        method: 'GET',
                        headers: {
                            app_key: '2c132785f8434f0e6b3a49c28895645f',
                            app_id: '2e2a3e6e'
                        },
                        params: {
                            termYear: date.getFullYear(),
                            term: term,
                            _type: 'json',
                            departmentName: match[1],
                            courseNumber: match[2]
                        }
                    }).then(function(response) {

                        //prevent previous network resolutions from overwriting newer ones (async issue)
                        match = regExp.exec($scope.search);
                        var temp = response.data.ClassOffering[0];
                        if (match && temp && temp.departmentCode && temp.courseNumber) {
                            if (temp.departmentCode.indexOf(match[1]) > -1 || ('' + temp.courseNumber).indexOf(match[2]) > -1) {
                                $scope.allClasses = response.data.ClassOffering.concat($scope.me.selectedClasses);
                            }
                        }

                    }, function(err) {
                        //flash.error = 'An error occurred while autofilling classes.';
                        //$scope.allClasses = [];
                    })
                }

            }

    };

    $scope.deletePicture = function() {
        $http({
            url: '/api/user/deletepicture',
            method: 'GET'
        }).success(function(data) {
            $scope.origMe.picture = data.picture;
            $scope.me.picture = data.picture;
            $scope.dataHasChanged = angular.equals($scope.me, $scope.origMe);
        }).error(function(err) {
            flash.err = err;
        });
    }

    $scope.resetSearchInput = function($select) {
        $select.search = "";
        $scope.search = "";
    };


    $scope.processForm = function() {
        $scope.me.classes = [];
        for (var c in $scope.me.selectedClasses) {
            var temp = $scope.me.selectedClasses[c];
            $scope.me.classes.push(temp.departmentCode + ' ' + temp.courseNumber);
        }
        $http.post('/api/userprofile', {data: $scope.me})
            .success(function(response) {
                $scope.origMe = angular.copy($scope.me);
                $scope.dataHasChanged = !angular.equals($scope.me, $scope.origMe);
                principal.updateIdentity($scope.me);
                flash.success = 'Profile saved.';
            })
            .error(function () {
                flash.error = 'Profile could not be saved. Please try again later.';
            });

    };


    $scope.onFileSelect = function($files) {
        //$files: an array of files selected, each file has name, size, and type.
        for (var i = 0; i < $files.length; i++) {
            var file = $files[i];
            $scope.upload = $upload.upload({
                url: '/api/userpicture', //upload.php script, node.js route, or servlet url
                method: 'POST',
//                headers: {'x-csrf-token': $scope.me.csrf},
                // withCredentials: true,
                //data: {_csrf: $scope.me.csrf},
                file: file // or list of files ($files) for html5 only
                //fileName: user.email + '.jpg' // to modify the name of the file(s)
                // customize file formData name ('Content-Disposition'), server side file variable name.
                //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file'
                // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
                //formDataAppender: function(formData, key, val){}
            }).progress(function(evt) {
//                console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
            }).success(function(data, status, headers, config) {
                // file is uploaded successfully
                console.log(data);
                $scope.me.picture = data.picture;
                $scope.origMe = angular.copy($scope.me);
                $scope.dataHasChanged = !angular.equals($scope.me, $scope.origMe);
                flash.success = 'Picture successfully uploaded.';
            })
            .error(function(err) {
                    flash.error = err;
                });
            //.then(success, error, progress);
            // access or attach event listeners to the underlying XMLHttpRequest.
            //.xhr(function(xhr){xhr.upload.addEventListener(...)})
        }
        /* alternative way of uploading, send the file binary with the file's content-type.
         Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
         It could also be used to monitor the progress of a normal http post/put request with large data*/
        // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
    };
}]);

var alumniCtrl = app.controller('alumniCtrl', ['$scope', '$http', '$location', 'flash', '$state', '$animate', function($scope, $http, $location, flash, $state, $animate) {
    $animate.enabled(false);

    $scope.formData = {};
    $scope.carInterval = 10000;
    $scope.slides = [
        {
            name: 'Benito Delgado-Olson',
            img: '/img/benito.jpg',
            description: 'Benito Delgado-Olson (’07) is the cofounder and Executive Director of K to College, ' +
                'a Bay Area nonprofit who’s mission is to promote equal access to education by ensuring every student ' +
                'has the resources and tools to learn from kindergarden to college. As a native of the East Bay and ' +
                'graduate of several East Bay public schools, Benito has a lifelong interest in the ' +
                'nonprofit sector and education. Benito graduated with a double major from Berkeley in 2007.',

            description2: 'During his senior year, he founded the student group that would eventually ' +
                'evolve into present day K to College. ' +
                'Since its inception, Benito has recruited a professional board of directors, ' +
                'designed, developed and implemented the proven K to College business model, secured ' +
                'both public and private partnerships at the state and local level and raised several ' +
                'million dollars for program operations. '
        },
        {
            name: 'Sean Ahrens',
            img: '/img/seanahrens.jpg',
            description: "Sean Ahrens ('08) is the cofounder of Crohnology, a patient-powered research network " +
                "that allows any patient to contribute to research for their condition. " +
                "At the age of 12, Sean was diagnosed with Crohn’s Disease, an incurable autoimmune condition " +
                "of the digestive tract. Sean has since made it his life’s mission to cure this disease by connecting " +
                "the world’s patients and empowering collective research toward a solution. " +
                "Sean is a two-time Y-Combinator, Rock Health, and UC Berkeley alum. As a programmer and software designer, " +
                "he has been a founder of, or early hire at, six different SF tech startups. Sean studied " +
                "Computer Science and Business during his time at UC Berkeley, and is the subject of two " +
                "documentaries on how technology is revolutionizing medicine.  He currently lives in San Francisco, CA."

        },
        {
            name: 'Daniel Zayas',
            img: '/img/dz3.jpg',
            description: 'Daniel Zayas (’12) is currently a Project Analyst for the Rio 2016 Olympic games in Brazil.' +
                ' Daniel majored in Civil Engineering and graduated first in his class in the department. ' +
                'Throughout his time at UC Berkeley Daniel was involved in numerous on-campus organizations ' +
                'including Steel Bridge and Club Soccer.'
        }
    ]

    $scope.verifyEmail = function() {

    }
}]);

var browseCtrl = app.controller('browseCtrl', ['$scope', '$http', '$location', 'flash', '$state', 'me', 'users', 'siteSocket', 'principal', 'messageFactory', 'userFactory', function($scope, $http, $location, flash, $state, me, users, siteSocket, principal, messageFactory, userFactory) {

    $scope.users = {};
    $scope.search = "";
    $scope.messageButtons = null;
    $scope.usersList = users;
    $scope.sortBy = 'lastOnline';
    $scope.busy = false;

    $scope.me = me;

    siteSocket.on('user:init', function(allUsers) {
        for (var key in allUsers) {
            if (!angular.isUndefined(key) && $scope.users[key]) {
                $scope.users[key].online = allUsers[key];
            } else if (!angular.isUndefined(key) && !$scope.users[key]){
                $scope.users[key] = {online : allUsers[key]};
            }
        }
    });

    $scope.displayUser = function(user) {
        user.majorString = user.major.length ? user.major.join(', ') : 'Unknown major.';
        user.minorString = user.minor && user.minor.length ? user.minor.join(', ') : 'N/A';
        user.name = user.name ? user.name : 'Unknown Name';
        user.classesString = user.classes.length ? user.classes.join(', ') : 'No classes.';
    };

    $scope.getThumbnail = function(picUrl) {
        if (!picUrl || picUrl == "" || picUrl == '/img/generic_avatar.gif') return '/img/generic_avatar.gif';
        return picUrl.substring(0, picUrl.lastIndexOf('/')) + '/thumbnails' + picUrl.substring(picUrl.lastIndexOf('/'));
    };


    $scope.me = me;
    $scope.siteSocket = siteSocket;
    $scope.rooms = {};
    $scope.quickMessageTo = null;
    $scope.sortCat = 'Name';
    $scope.getUrl = function() {
        return $location.path();
    };

    $scope.messages = {};

    $scope.message = {rows: 1, from: $scope.me.id, to: $scope.room, toEmail: ''};
    $scope.searchFocus = true;

    $scope.sortCats = ['Name', 'Email', 'Major', 'Minor', 'Status', 'Classes'];

    $scope.goToMessages = function(user) {
        messageFactory.getRoomId(user).then(function(room) {
            $state.transitionTo('site.auth.messages.room', {'roomId': room._id}, { reload: false, inherit: true, notify: true });
        })

    };

    $scope.getMoreUsers = function() {
        userFactory.getMoreUsers($scope.sortBy).then(function(usersArr) {
            $scope.usersList = usersArr;
        }, function(err) {
            flash.error = err;
        });
    };

    $scope.sortUsers = function(s) {
        $scope.sortBy = s;
        $scope.usersList.sort(function(a, b) {
            return a[$scope.sortBy] - b[$scope.sortBy];
        });
    };

}]);

var dashboardCtrl = app.controller('dashboardCtrl', ['$scope', '$http', '$location', 'users', 'flash', function($scope, $http, $location, users, flash) {

    $scope.users = users;


    $scope.takenPositions = [];
    $scope.allPositions = ["President", "VP Finance", "VP Loss Prevention", "VP Member Education",
        "VP Academic Excellence", "VP Administration", "House Improvement Chair", "VP External Relations",
        "Internal Social Chair", "External Social Chair", "Pledge Educator", "Hellmaster", "Webmaster",
        "Scholarship Chair", "House Manager", "Recruitment Chair", "Summer Manager"];

    $scope.allPositions = angular.copy($scope.openPositions);

    $scope.lastSaved = [];

    for (var i = 0; i < $scope.users.length; i++) {
        var user = $scope.users[i];
        $scope.lastSaved[user._id] = angular.copy(user);

        for (var j = 0; j < user.housePositions.length; j++) {
            var index = $scope.openPositions.indexOf(user.housePositions[j]);

            if (index > -1) {
                $scope.openPositions.splice(index, 1);
            }
            $scope.takenPositions.push(user.housePositions[j]);
        }
    }

    $scope.needsSave = function(user) {
        return $scope.lastSaved[user._id] ? !angular.equals(user, $scope.lastSaved[user._id]) : true;
    };

    $scope.print = function(obj) {
        console.log(obj);
    };

    $scope.openPosition = function(pos, user) {
        var index = user.housePositions.indexOf(pos);
        if (index > -1) {
            user.housePositions.splice(index, 1);
        }

        index = $scope.openPositions.indexOf(pos);
        if (index == -1) {
            $scope.openPositions.push(pos);
        }

        user.needsSave = $scope.needsSave(user);

        index = $scope.takenPositions.indexOf(pos);
        if (index > -1) {
            $scope.takenPositions.splice(index, 1);
        }
    };

    $scope.takePosition = function(pos, user) {
        var index = user.housePositions.indexOf(pos);
        if (index == -1) {
            user.housePositions.push(pos);
        }

        index = $scope.openPositions.indexOf(pos);

        if (index > -1) {
            $scope.openPositions.splice(index, 1);
        }

        user.needsSave = $scope.needsSave(user);

        index = $scope.takenPositions.indexOf(pos);

        if (index == -1) {
            $scope.takenPositions.push(pos);
        }
    };

    $scope.dataChanged = false;
    $scope.dropSupported = true;
    $scope.disabled = undefined;
    $scope.allRoles = ["User", "Admin", "Blogger", "Excomm"];
    $scope.statusSelect = {
        isopen: false
    };

    $scope.statuses = ['Active', 'Alumni', 'Pledge'];
    $scope.posSelect = {
        isopen: false
    };
    $scope.addresses = [];
    $scope.address = {};
    $scope.formData = {};

    $scope.saveUser = function(user) {

        $http.post('/api/admin/saveuser', {user: user})
            .success(function(data) {
                flash.success = 'Profile for ' + user.username + ' saved successfully.';
                $scope.lastSaved[user._id] = angular.copy(user);
                user.needsSave = false;
            })
            .error(function(err) {
                flash.error = 'An error occurred while saving data for ' + user.username + '. Please try again.';
            });
    };

    $scope.deleteUser = function(user) {

        $http.post('/api/admin/deleteuser', {user: user})
            .success(function(data) {

                flash.success = 'Profile for ' + user.username + ' deleted successfully.';
                $scope.lastSaved[user._id] = null;
                user = null;
            })
            .error(function(err) {
                console.log(err);
                flash.error = 'An error occurred while saving data for ' + user.username + '. Please try again.';
            });
    };

}]);

var loginCtrl = app.controller('loginCtrl', ['$scope', '$http', '$location', '$window', 'principal', 'flash', '$state', function($scope, $http, $location, $window, principal, flash, $state) {

    $scope.processForm = function() {
        if ($scope.formData.email && $scope.formData.password ) {
            var credentials = {
                email: $scope.formData.email,
                password: $scope.formData.password
            };
            principal.login(credentials).then(function(identity) {
                if (!identity.verified) {
                    $state.transitionTo('site.auth.verify');
                } else {
                    $state.transitionTo('site.auth.browse');
                }
            }, (function(error) {
                flash.error = error;
            }));
        }
    };



    $scope.getUrl = function() {
        return $location.path()
    }

}]);
var messagesCtrl = app.controller('messagesCtrl', ['$scope', '$http', '$location', 'flash', '$state', '$stateParams', 'siteSocket', 'messageFactory', 'userFactory', 'me', 'allRooms', function($scope, $http, $location, flash, $state, $stateParams, siteSocket, messageFactory, userFactory, me, allRooms) {
    $scope.search = "";
    $scope.siteSocket = siteSocket;
    $scope.room = null;
    $scope.toUsers = {};
    $scope.selectedSearchCat = 'Name';
    $scope.getUrl = function() {
        return $location.path();
    };
    $scope.userInfo = {};
    $scope.rooms = allRooms;
    $scope.roomsArr = [];

    var roomIds = [];
    for (var r in allRooms) {
        if (allRooms[r].messages.length > 0) {
            roomIds.push(r);
        }
        allRooms[r].selected = false;
        $scope.roomsArr.push($scope.rooms[r]);
    }
    if (roomIds.length > 0) {
        messageFactory.getMultipleRoomsToUsers(roomIds, me)
            .then(function(roomsIdsToUserArr) {
                for (var r in roomsIdsToUserArr) {
                    $scope.rooms[r].toUserArr = roomsIdsToUserArr[r];
                }
            }, function(err) {
                console.log(err);
            });
    }

    $scope.goToRoom = function(roomId, oldRoomId) {
        if (oldRoomId) {
            allRooms[oldRoomId].selected = false;
        } else {
            for (var r in allRooms) {
                allRooms[r].selected = false;
            }
        }
        $state.transitionTo('site.auth.messages.room', {'roomId': roomId}, { reload: false, inherit: true, notify: true });
    };
    $scope.getThumbnail = function(picUrl) {
        if (!picUrl || picUrl == "" || picUrl == '/img/generic_avatar.gif') return '/img/generic_avatar.gif';
        return picUrl.substring(0, picUrl.lastIndexOf('/')) + '/thumbnails' + picUrl.substring(picUrl.lastIndexOf('/'));
    };

    siteSocket.on('user:init', function(allUsers) {
        for (key in allUsers) {
            if (!angular.isUndefined(key) && $scope.users[key]) {
                $scope.users[key].online = allUsers[key];
            }
        }
    });



    siteSocket.on('send:message', function(message) {
        if ($scope.room != message.to) {
            $scope.$parent.newMessages += 1;
        }
        messageFactory.addMessage(message);
    });

}]);

var navCtrl = app.controller('navCtrl', ['$scope', '$location', 'authorize', function($scope, $location, authorize) {
    $scope.status = {
        isopen: true
    };


}]);
var newBlogPostController = app.controller('newBlogPostCtrl', ['$scope', '$http', '$upload', 'flash', '$location', function($scope, $http, $upload, flash, $location) {
    $scope.blogpost = {};

    $scope.blogpost.title = '';
    $scope.blogpost.text = '';
    $scope.user = {};
    $scope.blogpost.pictures = [];

    $scope.publish = function () {
        if (!$scope.blogpost.title || !$scope.blogpost.text) {
            flash.error = 'Please fill in ' + ($scope.blogpost.title ? ' text.' : 'title.');

        } else {
            $http.post('/api/blog/newpost', {blogpost: $scope.blogpost})
                .success(function(data) {
                    $location.path('/blog');
                })
                .error(function(err) {
                    console.log(err);
                    flash.error("An error occurred. Try again later.");
                })
        }
    };

    $scope.onFileSelect = function(file, insertAction) {
        //$files: an array of files selected, each file has name, size, and type.
        $scope.upload = $upload.upload({
            url: '/blog/picture', //upload.php script, node.js route, or servlet url
            method: 'POST',
            headers: {
                'x-csrf-token': $scope.user.csrf
            },
            //withCredentials: true,
            file: file // or list of files ($files) for html5 only
            //fileName: user.email + '.jpg' // to modify the name of the file(s)
            // customize file formData name ('Content-Disposition'), server side file variable name.
            //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file'
            // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
            //formDataAppender: function(formData, key, val){}
        }).progress(function(evt) {
            console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
        }).success(function(data, status, headers, config) {
            // file is uploaded successfully
            console.log(data);
            $scope.blogpost.pictures.push(data.picture);
            return true;
        })
        .error(function(data, status, headers, config) {
                console.log(data);
                console.log($scope.blogpost.text);
            });
        //.then(success, error, progress);
        // access or attach event listeners to the underlying XMLHttpRequest.
        //.xhr(function(xhr){xhr.upload.addEventListener(...)})
        };
        return true;
        /* alternative way of uploading, send the file binary with the file's content-type.
         Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
         It could also be used to monitor the progress of a normal http post/put request with large data*/
        // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
}]);
var registerCtrl = app.controller('registerCtrl', ['$scope', '$http', '$location', '$cookieStore', '$state', 'principal', 'flash', function($scope, $http, $location, $cookieStore, $state, principal, flash) {
    $scope.user = {
    };


    $scope.fromStateIndex = 0;
    $scope.toStateIndex = 1;
    $scope.leaveLeft = true;
    $scope.forms = [ '.email', '.name', '.password', '.repassword'];
    $scope.validForms = {};


    $scope.processRegForm = function() {

        if ($scope.formData.email && $scope.formData.password && $scope.formData.password === $scope.formData.repassword) {
            if ($scope.formData.email.indexOf('@berkeley.edu') == -1) {
                flash.error = 'You must provide a valid Berkeley email.';
            } else if (!$scope.formData.password){
                flash.error = 'You must provide a password.';
            } else {
                principal.register($scope.formData).then(function(data) {
                    $state.transitionTo('site.auth.verify', { reload: false, inherit: true, notify: true });
                }, function(error, data) {
                    flash.error = error;
                });
            }


        } else if ($scope.formData.password !== $scope.formData.repassword){
            flash.error = 'Passwords must match.';
        } else if (!$scope.formData.email) {
            flash.error = 'You must provide a valid Berkeley email.';
        } else {
            flash.error = 'An unknown error occurred. Please try again later.';
        }

    };



    $scope.$on('$stateChangeStart',
        function(evt, toState, toParams, fromState, fromParams) {
            $scope.fromStateIndex = $scope.forms.indexOf(fromState.name.substring(fromState.name.lastIndexOf('.')));
            $scope.toStateIndex = $scope.forms.indexOf(toState.name.substring(toState.name.lastIndexOf('.')));

            $scope.leaveLeft = $scope.fromStateIndex < $scope.toStateIndex;
    });


    $scope.getUrl = function() {
        return $location.path()
    }

}]);
var roomCtrl = app.controller('roomCtrl', ['$scope', '$http', '$location', 'flash', '$state', '$stateParams', 'siteSocket', 'me', 'messageFactory', 'allRooms', 'messages', function($scope, $http, $location, flash, $state, $stateParams, siteSocket, me, messageFactory, allRooms, messages) {
    siteSocket.emit('join:room', $stateParams.roomId);
    $scope.search = "";
    $scope.toUser = {};
    $scope.message = {};
    $scope.me = me;
    for (var r in allRooms) {
        allRooms[r].selected = false;
    }
    $scope.room = allRooms[$stateParams.roomId];
    $scope.room.selected = true;

    messageFactory.getRoomToUsers($stateParams.roomId, me).then(function(toUsersArr) {
        $scope.toUser = toUsersArr[0];
        $scope.toUser.classesString = $scope.toUser.classes.length ? $scope.toUser.classes.join(', ') : "No classes.";
        $scope.message = {rows: 1, from: $scope.me._id, to: $stateParams.roomId, toEmail: $scope.toUser.email};
    }, function(err) {
        flash.error = err;
    });



    $scope.messages = messages;

    $scope.roomId = $stateParams.roomId;

    $scope.siteSocket = siteSocket;

    $scope.getUrl = function() {
        return $location.path();
    };

    $scope.formatDate = function(dateString) {
        var date = new Date(dateString);
        return {
            year : date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            time: date.getHours() + ":" + date.getMinutes()
        }
    };

    $scope.getThumbnail = function(picUrl) {
        if (!picUrl || picUrl == "" || picUrl == '/img/generic_avatar.gif') return '/img/generic_avatar.gif';
        return picUrl.substring(0, picUrl.lastIndexOf('/')) + '/thumbnails' + picUrl.substring(picUrl.lastIndexOf('/'));
    };


    $scope.sendMessage = function() {
        if ($scope.message.to && $scope.message.from && $scope.message.text && $scope.message.toEmail) {
            $scope.message.created = Date.now();
            siteSocket.emit('send:message', $scope.message);
            messageFactory.addMessage($scope.roomId, $scope.message).then(function(messages) {
                $scope.messages = messages;
                $scope.$parent.rooms[$scope.roomId].lastMessage = $scope.message.text;
                $scope.$parent.rooms[$scope.roomId].lastMessageCreated = $scope.message.created;
                $scope.message = {toEmail: $scope.message.toEmail, rows: 1, from: $scope.me._id, to: $scope.roomId};

            }, function(err) {
                console.log(err);
            });

        } else if ($scope.message.text) {
            flash.error = 'An unknown error occurred. Please try again later.';
        }
    };

    siteSocket.on('send:message', function(message) {
        if ($scope.roomId != message.to) {
            $scope.$parent.newMessages += 1;
        }

        $scope.$parent.rooms[$scope.roomId].lastMessage = message.text;
        $scope.$parent.rooms[$scope.roomId].lastMessageCreated = message.created;

        messageFactory.addMessage($scope.roomId, message).then(function(messages) {
            $scope.messages = messages;
        }, function(err) {
            flash.err = err;
        });
    });


}]);

var scholarshipCtrl = app.controller('scholarshipCtrl', ['$scope', '$upload', '$http', '$location', function($scope, $upload, $http, $location) {
    $scope.user = {
    };

    $scope.form = ($location.path() != '/scholarship');

    $scope.formData = {};

    $scope.processForm = function() {

    };

    $scope.addresses = [];
    $scope.address = {};

    $scope.refreshAddresses = function(address) {
        var params = {address: address, sensor: false};
        return $http.get(
            'http://maps.googleapis.com/maps/api/geocode/json?',
            {params: params}
        ).then(function(response) {
                $scope.addresses = response.data.results;
            });
    };

    $scope.getUrl = function() {
        return $location.path()
    }

}]);
app.controller('siteCtrl', ['$scope', '$location', 'principal', 'siteSocket', '$rootScope', '$state', function ($scope, $location, principal, siteSocket, $rootScope, $state) {
    $scope.users = {};

    $scope.setCurrentUser = function (user) {
        $scope.currentUser = user;
    };

    $rootScope.$on('$stateChangeError',
        function(event, toState, toParams, fromState, fromParams, error){
            console.log(event);
            console.log(error);
        });


    $scope.principal = principal;
    $scope.newMessages = 0;


    $scope.getUrl = function() {
        return '' + $location.path();
    };

    $scope.logout = function() {
        principal.logout().then(function(data) {
            $state.transitionTo($state.current, {}, {reload: true});
            siteSocket.emit('disconnect');
        }, (function(error) {
            flash.error = error;
        }));
    }
}]);
var verifyCtrl = app.controller('verifyCtrl', ['$scope', '$upload', '$http', function($scope, $upload, $http) {
    $scope.user = {
    };

    $scope.formData = {};

    $scope.processForm = function() {

    };

    $scope.addresses = [];
    $scope.address = {};

    $scope.refreshAddresses = function(address) {
        var params = {address: address, sensor: false};
        return $http.get(
            'http://maps.googleapis.com/maps/api/geocode/json',
            {params: params}
        ).then(function(response) {
                $scope.addresses = response.data.results;
                console.log(address);
                console.log($scope.addresses);
            });
    };

}]);