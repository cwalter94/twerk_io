var app = angular.module('twerkApp', ['ui.utils','angular-loading-bar', 'ngAnimate', 'ui.select', 'angularFileUpload', 'ui.bootstrap', 'ngSanitize',
    'mgcrea.ngStrap', 'textAngular', 'xeditable','angular-flash.service', 'angular-flash.flash-alert-directive', 'ui.router', 'ngCookies', 'smart-table',
    'btford.socket-io', 'once', 'infinite-scroll'], function() {

})
    .config(function(uiSelectConfig, flashProvider, $httpProvider, $stateProvider, $urlRouterProvider, $locationProvider, cfpLoadingBarProvider) {

    uiSelectConfig.theme = 'selectize';
    $locationProvider.html5Mode(true).hashPrefix('!');
    $httpProvider.interceptors.push('authInterceptor');
    flashProvider.errorClassnames.push('alert-danger');
    flashProvider.successClassnames.push('alert-success');
    cfpLoadingBarProvider.latencyThreshold = 0;

    $stateProvider.state('site', {
        abstract: true,
        templateUrl: '/partials/outer/index',
        controller: 'siteCtrl',
        url: '',
        resolve: {
            authorize: ['authorization',
                function(authorization) {
                    return authorization.authorize();
                }
            ]
        }
    })
        .state('site.home', {
            templateUrl: '/partials/outer/home',
            controller: function($scope) {

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

        .state('site.home.verify', {
            url: 'verify',
            templateUrl: '/partials/outer/verify'
        })

        .state('site.home.checkVerification', {
            url: 'verify/:code',
            templateUrl: '/partials/outer/checkVerification'
        })


        .state('site.profile', {
            url: '/profile',
            templateUrl: '/partials/outer/account',
            controller: 'accountCtrl',
            resolve: {
                user: ['$http',
                    function($http) {
                        return $http.get('/api/userprofile/')
                            .then(function(response) {
                                return response.data.user;
                            });

                    }
                ]
            }
        })

        
        .state('site.dashboard', {
            url: '/dashboard',
            templateUrl: '/partials/outer/dashboard',
            abstract: true
        })
        .state('site.dashboard.users', {
            url: '/users',
            controller: 'dashboardCtrl',

            templateUrl: '/partials/inner/dashboard/users',
            resolve: {
                users: ['$http', function($http) {
                    return $http.get('/api/admin/allusers')
                        .then(function(response) {
                            return response.data.users;
                        });
                }]
            }
        })

        .state('site.messages', {
            url: '/messages',
            controller: 'messagesCtrl',
            templateUrl: '/partials/outer/messages',
            resolve: {
                rooms: ['$http', function($http) {
                    return $http.get('/api/messages')
                        .then(function(response) {
                            console.log(response.data.rooms);
                            return response.data.rooms;
                        });
                }],
                me: ['principal', function(principal) {
                    return principal.identity().then(function(me) {
                        return me;
                    })
                }]
            }
        })
        .state('site.messages.room', {
            url: '/{roomId}',
            templateUrl: '/partials/inner/messages/rightpane',
            controller: function($scope) {
                console.log($scope);
            }
        })


        .state('site.browse', {
            url: '/browse',
            templateUrl: '/partials/outer/browse',
            controller: 'browseCtrl',
            resolve: {
                me: ['principal', function(principal) {
                    return principal.identity().then(function(data) {
                        return data;
                    })
                }]
            }
        })
        .state('site.browse.room', {
            url: '/{roomId}',
            templateUrl: '/partials/inner/messages/rightpane',
            controller: function($scope) {
                $http.get('/api/messages/' + $stateParams.roomId).then(function(response) {
                    $scope.room = response.data.messages;
                })
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

    .factory('principal', ['$q', '$http', '$timeout', '$window','$cookieStore', '$location',
    function($q, $http, $timeout, $window, $cookieStore, socket) {
        var _identity = undefined,
            _authenticated = false;

        return {
            isIdentityResolved: function() {
                return angular.isDefined(_identity);
            },

            isAuthenticated: function() {
                return _authenticated;
            },

            isInRole: function(role) {

                if (!_authenticated || (!angular.isUndefined(_identity) && !_identity.roles)) return false;

                return _identity.roles.indexOf(role) != -1;
            },
            isInAnyRole: function(roles) {
                if (!_authenticated || !_identity.roles) return false;

                for (var i = 0; i < roles.length; i++) {
                    if (this.isInRole(roles[i])) return true;
                }

                return false;
            },
            authenticate: function(identity) {
                _identity = identity;
                _authenticated = identity != null;
            },
            identity: function(force) {
                var deferred = $q.defer();

                if (force === true) _identity = undefined;
                // check and see if we have retrieved the identity data from the server. if we have, reuse it by immediately resolving
                if (angular.isDefined(_identity)) {
                    deferred.resolve(_identity);
                    return deferred.promise;
                }
                else {

                    $http.get('/api/user')
                        .success(function(data) {
                            _identity = data.user;
                            _authenticated = true;
                            deferred.resolve(_identity);
                        })
                        .error(function (err) {
                            console.log(err);
                            _identity = null;
                            _authenticated = false;
                            deferred.resolve(_identity);
                        });


                    return deferred.promise;
                }



            },
            login: function(credentials) {
                var deferred = $q.defer();


                $http.post('/authenticate', {credentials: credentials})
                    .success(function(data) {
                        _identity = data.user;
                        $cookieStore.put('jwt', data.token);
                        _authenticated = true;
                        deferred.resolve(_identity);
                    })
                    .error(function (err) {
                        _identity = null;
                        _authenticated = false;
                        $cookieStore.put('jwt', null);
                        deferred.reject(err);
                    });

                return deferred.promise;
            },

            logout: function() {
                var deferred = $q.defer();

                $http.get('/api/logout')
                    .success(function(data) {
                        _identity = null;
                        $cookieStore.put('jwt', null);
                        $cookieStore.put('username', null);
                        _authenticated = false;
                        deferred.resolve(_identity);
                    })
                    .error(function (err) {
                        _identity = null;
                        _authenticated = false;
                        $cookieStore.put('jwt', null);
                        $cookieStore.put('username', null);
                        socket.emit('disconnect', {});
                        deferred.reject(err);
                    });
                return deferred.promise;
            },
            register: function(formData) {
                var deferred = $q.defer();


                $http.post('/register', formData)
                    .success(function(data) {
                        _identity = data.user;
                        $cookieStore.put('jwt', data.token);
                        _authenticated = true;
                        deferred.resolve(_identity);
                    })
                    .error(function (err) {
                        _identity = null;
                        _authenticated = false;
                        $cookieStore.put('jwt', null);
                        deferred.reject(err);
                    });

                return deferred.promise;
            },
            sendMessage: function(message) {
                var deferred = $q.defer();


                $http.post('/api/user/messages/' + message.to, message)
                    .success(function(data) {
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
            }
        };
    }
])
    .factory('authorization', ['$rootScope', '$state', 'principal', '$location',
        function($rootScope, $state, principal, $location) {
            return {
                authorize: function() {
                    return principal.identity()
                        .then(function() {

                            var isAuthenticated = principal.isAuthenticated();
                            if (
                                ($rootScope.toState.data && $rootScope.toState.data.roles
                                    && $rootScope.toState.data.roles.length > 0
                                && !principal.isInAnyRole($rootScope.toState.data.roles))) {

                                if (!isAuthenticated) {
                                    // user is not authenticated. stow the state they wanted before you
                                    // send them to the signin state, so you can return them when you're done
                                    $rootScope.returnToState = $rootScope.toState;
                                    $rootScope.returnToStateParams = $rootScope.toStateParams;

                                    // now, send them to the signin state so they can log in
                                    $location.path('/login')
                                }
                            } else if (isAuthenticated && $rootScope.toState && $rootScope.toState.name.indexOf('home') > -1){
                                $location.path('/browse');
                            }
                        });
                }
            };
        }
    ])
    .factory('authInterceptor', function ($rootScope, $q, $cookieStore, $location) {
        return {
            request: function (config) {
                if (config.url.indexOf('http://maps.googleapis.com/maps/api/geocode/json?') > -1) return config;

                config.headers = config.headers || {};

                if ($cookieStore.get('jwt')) {
                    config.headers.Authorization = 'Bearer ' + $cookieStore.get('jwt');
                } else if ($location.path() === '/account/profile' || $location.path().indexOf('/browse') > -1) {
                    $location.path('/login');
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
    .factory('socket', function (socketFactory, $cookieStore, principal) {
        if ($cookieStore.get('jwt')) {

            var authSocket = io.connect('', {
                query: 'token=' + $cookieStore.get('jwt'),
            });

            mySocket = socketFactory({
                ioSocket: authSocket
            });

            return mySocket;

        } else {
            console.log("Socket auth failed.");
            return {};
        }
    })
    .filter('browseFilter',function() {
        return function(users, search) {
            if (search == null) return users;
            var results = {};

            for (var email in users) {
                var user = users[email];
                var userString = email + ' ' + user.name + ' '  + user.status;
                if (user.classes && user.classes.length) userString += ' ' + user.classes.join(' ');
                if (user.major && user.major.length) userString += ' '  + user.major.join(' ');
                if (user.minor && user.minor.length) userString += ' ' + user.minor.join(' ');

                var searchStrings = search.split(' ');
                for (var i = 0; i < searchStrings.length; i++) {
                    if (userString.toLowerCase().indexOf(searchStrings[i].toLowerCase()) > -1) {
                        results[email] = user;
                    } else {
                        delete results[email];
                        break;
                    }
                }
            }
            return results;
        }
    })
    .run(['$rootScope', '$state', '$stateParams', 'authorization', 'principal', 'editableOptions',
        function($rootScope, $state, $stateParams, authorization, principal, editableOptions) {
            editableOptions.theme = 'bs3';

            $rootScope.$on('$stateChangeStart', function(event, toState, toStateParams) {
                // track the state the user wants to go to; authorization service needs this

                $rootScope.toState = toState;
                $rootScope.toStateParams = toStateParams;
                // if the principal is resolved, do an authorization check immediately. otherwise,
                // it'll be done when the state it resolved.

                if (principal.isIdentityResolved()) authorization.authorize();

            });
        }
    ]);