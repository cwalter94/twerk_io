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
                                    $state.transitionTo('site.auth.browse.all');
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
                                    $state.transitionTo('site.auth.browse.intro.step1');
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
                                return null;
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
                    }]
                }
            })
            .state('site.auth.browse.intro', {
                url: '/intro',
                controller: 'accountCtrl',
                abstract: true,
                templateUrl: '/partials/inner/intro/intro'
            })
            .state('site.auth.browse.intro.step1', {
                url: '/step1',
                templateUrl:'/partials/inner/intro/step1'
            })
            .state('site.auth.browse.intro.step2', {
                url: '/step2',
                templateUrl: '/partials/inner/intro/step2'
            })
            .state('site.auth.browse.all', {
                url: '',
                controller: 'groupCtrl',
                templateUrl: '/partials/inner/browse/groupAll',
                resolve: {
                    me: ['principal', '$location', '$state',
                        function (principal, $location, $state) {
                            return principal.identity().then(function(identity) {
                                if (identity && !identity.verified) {
                                    $state.transitionTo('site.auth.verify');
                                }
                                var temp = false;
                                for (var key in identity.groups) {
                                    if (identity.groups[key]) {
                                        temp = true;
                                        break;
                                    }
                                }

                                if (!temp) {
                                    $state.transitionTo('site.auth.browse.intro.step1');
                                }
                                return identity;
                            }, function(err) {
                                $location.path('/login');
                                return null;
                            });
                        }
                    ]
                }
            })
            .state('site.auth.browse.group', {
                url: '/{url}',
                controller: 'groupCtrl',
                templateUrl: '/partials/inner/browse/group',
                resolve: {
                    me: ['principal', '$location', '$state',
                        function (principal, $location, $state) {
                            return principal.identity().then(function(identity) {
                                if (identity && !identity.verified) {
                                    $state.transitionTo('site.auth.verify');
                                }
                                var temp = false;
                                for (var key in identity.groups) {
                                    if (identity.groups[key]) {
                                        temp = true;
                                        break;
                                    }
                                }

                                if (!temp) {
                                    $state.transitionTo('site.auth.browse.intro.step1');
                                }
                                return identity;
                            }, function(err) {
                                $location.path('/login');
                                return null;
                            });
                        }
                    ]
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