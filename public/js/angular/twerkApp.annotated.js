var app = angular.module('twerkApp', ['ui.utils', 'angular-loading-bar', 'ngAnimate', 'ui.select', 'angularFileUpload', 'ui.bootstrap',
    'mgcrea.ngStrap', 'xeditable', 'angular-flash.service', 'angular-flash.flash-alert-directive', 'ui.router', 'ngCookies',
    'btford.socket-io', 'once', 'infinite-scroll', 'luegg.directives', 'textAngular'], function () {

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
                                    $state.transitionTo('site.auth.browse.feed');
                                }
                                return identity;
                            }, function(err) {
                                return null;
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
            .state('site.home.live', {
                url: '/live',
                templateUrl: '/partials/inner/home/live'
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
                controller: ['$scope', '$http', 'flash', 'sendEmailFn', 'principal', '$state', function($scope, $http, flash, sendEmailFn, principal, $state) {
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
            .state('site.auth.browse.feed', {
                url: '',
                controller: 'feedCtrl',
                templateUrl: '/partials/inner/browse/feed',
                reload: true,
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
var accountCtrl = app.controller('accountCtrl', ['$scope', '$upload', '$http', '$location', 'me', 'flash', '$cookieStore', 'principal', 'siteSocket', 'groupFactory', function($scope, $upload, $http, $location, me, flash, $cookieStore, principal, siteSocket, groupFactory) {

    $scope.me = me;
    $scope.me.selectedClasses = [];
    $scope.statusSaved = false;
    $scope.allClasses = [];
    $scope.loadingClasses = [{departmentCode: 'Loading classes...', courseNumber: ''}];
    $scope.courseSearch = {departments: [], selectedDepartment: "", courses: [], selectedCourse: ""};
    $http({
        url: '/api/departments',
        method: 'GET'
    }).success(function(data) {
        $scope.courseSearch.departments = data.departments;
    });

    $scope.origMe = angular.copy($scope.me);
    $scope.initialComparison = !angular.equals($scope.me, $scope.origMe);
    $scope.dataHasChanged = angular.copy($scope.initialComparison);

    $scope.dropSupported = true;
    $scope.disabled = undefined;

    $scope.search = "";

    $scope.$watch('me.name', function(newval, oldval) {
       if (newval != oldval) {
           $scope.dataHasChanged = !angular.equals($scope.me.name, $scope.origMe.name);
       }
    });

    $scope.$watch('me.status', function(newval, oldval) {
        if (newval != oldval) {
            $scope.dataHasChanged = !angular.equals($scope.me.status, $scope.origMe.status);
            $scope.statusSaved = false;
        }
    });

    $scope.$watch('courseSearch.selectedDepartment', function(newval, oldval) {
        if (newval != "") {
            $scope.getCoursesForDepartment(newval);
        }
    });

    $scope.addGroup = function() {
        groupFactory.addGroup($scope.courseSearch.selectedCourse).then(function(groups) {
            groupFactory.getGroups(me).then(function(groups) {
                angular.forEach(groups, function(group) {
                   groupFactory.getGroupPosts(group._id);
                });
            });

        }, function(err) {
            console.log(err);
        });
    };
    $scope.saveStatusUpdate = function() {
        $scope.me.statusCreated = Date.now();

        $http.post('/api/userprofile', {data: $scope.me})
            .success(function(response) {
                siteSocket.emit('update:status', {userId: $scope.me._id, status: $scope.me.status, statusCreated: Date.now()});
                $scope.me.statusCreated = Date.now();
                $scope.me.statusDateFormatted = $scope.formatDate($scope.me.statusCreated);
                principal.updateIdentity($scope.me).then(function(response) {
                    $scope.statusInput = "";
                    $scope.statusSaved = true;
                })
            })
            .error(function () {
                flash.error = 'Profile could not be saved. Please try again later.';
            });
    };

    $scope.getCoursesForDepartment = function(selectedDepartment) {
            $http({
                url: '/api/courses',
                method: 'GET',
                params: {
                    department: selectedDepartment
                }
            }).success(function(data) {
                $scope.courseSearch.courses = data.courses;
            })

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
    };

    $scope.removeGroup = function(group) {
        $http({
            url: '/api/groups/' + group._id + '/removeUser',
            method: 'POST'
        }).success(function(response) {
            delete me.groups[group._id];
        }).error(function(err) {
            flash.error = err;
        });
    };

    $scope.resetSearchInput = function($select) {
        $select.search = "";
        $scope.search = "";
    };


    $scope.processForm = function() {
        $http.post('/api/userprofile', {data: $scope.me})
            .success(function(response) {
                if ($scope.origMe.status != $scope.me.status) {
                    siteSocket.emit('update:status', {userId: $scope.me._id, status: $scope.me.status, statusCreated: Date.now()})
                }
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

var authCtrl = app.controller('authCtrl', ['$scope', '$state', '$rootScope', 'me', 'siteSocket', 'userFactory', 'messageFactory', 'livePostFactory', 'allRooms', function ($scope, $state, $rootScope, me, siteSocket, userFactory, messageFactory, livePostFactory, allRooms) {


    siteSocket.emit('user:init', me._id);
    siteSocket.on('user:init', function(userOnlineStatus) {
        userFactory.allUserOnlineStatus(userOnlineStatus);

    });

    var temp = [];
    for (var r in allRooms) {
        temp.push(r);
    }
    siteSocket.emit('join:room:arr', temp);


    messageFactory.getUnreadMessages(me._id).then(function(unreadMessages) {
        $rootScope.$emit('updateUnreadMessages', unreadMessages);
    });

    siteSocket.on('new:room', function(roomId) {
        console.log("NEW ROOM ", roomId);
        messageFactory.addRoom(roomId).then(function(room) {
            siteSocket.emit('join:room:arr', [roomId]);
        });
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



    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, err) {
        if (toState.name.indexOf('site.auth.messages.room') == -1) {
            messageFactory.setCurrentRoom(null, null, siteSocket).then(function(currRoom) {

            });
        }
    });

    siteSocket.on('send:message', function(message) {
        messageFactory.addMessage(message.to, message, me._id, siteSocket);
    });

    siteSocket.on('new:livePost', function(livePost) {

        livePostFactory.addNewPost(livePost).then(function(livePost) {
            $rootScope.$broadcast('new:livePost', livePost);
        }, function(err) {
            console.log(err);
        })
    });


    siteSocket.on('new:comment', function(comment) {
        groupFactory.addNewComment(comment);
    })



}]);
var browseCtrl = app.controller('browseCtrl', ['$scope', '$http', '$location', 'flash', '$state', 'me', 'usersObj', 'siteSocket', 'principal', 'messageFactory', 'userFactory', function($scope, $http, $location, flash, $state, me, usersObj, siteSocket, principal, messageFactory, userFactory) {

    $scope.users = usersObj;
    $scope.search = "";
    $scope.messageButtons = null;
    $scope.sortBy = 'lastOnline';
    $scope.busy = false;
    $scope.moreUsersDisabled = false;
    $scope.overrideMoreUsersDisabled = false;
    $scope.loadUsersButtonText = 'Click to load more users.';
    $scope.me = me;
    $scope.currentClassFilter = "";
    $scope.groups = me.groups;

    $scope.formatDate = principal.formatDate;

    $scope.me.statusDateFormatted = $scope.formatDate($scope.me.statusCreated);

    $scope.selectedClass = 'All';
    $scope.statusInput = "";
    $scope.statusInputShow = false;

    $scope.displayUser = function(user) {
        user.majorString = user.major.length ? user.major.join(', ') : 'Unknown major.';
        user.minorString = user.minor && user.minor.length ? user.minor.join(', ') : 'N/A';
        user.name = user.name ? user.name : 'Unknown Name';
        user.classesString = user.classes.length ? user.classes.join(', ') : 'No classes.';
    };

    $scope.getThumbnail = userFactory.getThumbnail;



    siteSocket.on('update:status', function(data) {
        userFactory.updateUserStatus(data.userId, data.status, data.statusCreated).then(function(user) {
            $scope.users[user._id].status = user.status;
            $scope.users[user._id].statusCreated = new Date(user.statusCreated).toString();

        }, function(err) {

        })
    });

    $scope.me = me;
    $scope.siteSocket = siteSocket;
    $scope.rooms = {};
    $scope.quickMessageTo = null;
    $scope.sortCat = 'Name';
    $scope.getUrl = function() {
        return $location.path();
    };

    $scope.$watch('search', function(newval, oldval) {
       if (newval != '') {
           $scope.overrideMoreUsersDisabled = true;
           $scope.loadUsersButtonText = 'Click to load more users.';
       }
    });

    $scope.$watch('currentClassFilter', function(newval, oldval) {
        $scope.overrideMoreUsersDisabled = true;
        $scope.loadUsersButtonText = 'Click to load more users.';
    });

    $scope.cancelStatusUpdate = function() {
        $scope.statusInput = "";
        $scope.statusInputShow = false;
    };

    $scope.saveStatusUpdate = function() {
        $scope.me.status = $scope.statusInput;
        $scope.me.statusCreated = Date.now();

        $http.post('/api/userprofile', {data: $scope.me})
            .success(function(response) {
                siteSocket.emit('update:status', {userId: $scope.me._id, status: $scope.me.status, statusCreated: Date.now()});
                $scope.me.statusCreated = Date.now();
                $scope.me.statusDateFormatted = $scope.formatDate($scope.me.statusCreated);
                principal.updateIdentity($scope.me).then(function(response) {
                    $scope.statusInput = "";
                    $scope.statusInputShow = false;
                })
            })
            .error(function () {
                flash.error = 'Profile could not be saved. Please try again later.';
            });
    };

    $scope.filterByClass = function(className) {
        if (className == 'All') {
            $scope.currentClassFilter = "";
        } else {
            $scope.currentClassFilter = className;
        }
    };

    $scope.messages = {};

    $scope.message = {rows: 1, from: $scope.me.id, to: $scope.room, toEmail: ''};
    $scope.searchFocus = true;

    $scope.sortCats = ['Name', 'Email', 'Major', 'Minor', 'Status', 'Classes'];

    $scope.goToMessages = function(user) {
        messageFactory.getRoomId(user, siteSocket).then(function(room) {
            $state.transitionTo('site.auth.messages.room', {'roomId': room._id}, { reload: false, inherit: true, notify: true });
        });

    };

    $scope.getMoreUsers = function() {
        if (!$scope.moreUsersDisabled || $scope.overrideMoreUsersDisabled) {
            userFactory.getMoreUsers('statusCreated').then(function(usersArr) {
                var newUsers = false;
                for (var i = 0; i <  usersArr.length; i++) {
                    var elem = usersArr[i];
                    if ($scope.users[elem._id] == null) {
                        newUsers = true;
                        $scope.users[elem._id] = elem;
                    }
                }
                if (!newUsers) {
                    $scope.newUsersDisabled = true;
                    if ($scope.currentClassFilter == "") {
                        $scope.loadUsersButtonText = 'No more users to load.';
                    } else {
                        $scope.loadUsersButtonText = 'Whoops! It appears no one else in that class is on Twerk yet. Tell your classmates to try it out!';
                    }
                }
            }, function(err) {
                flash.error = err;
            });
        }

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

var feedCtrl = app.controller('feedCtrl', ['$scope', '$http', '$location', '$q', 'flash', '$state', '$stateParams', 'me', 'siteSocket', 'principal', 'userFactory', 'livePostFactory', '$rootScope', function($scope, $http, $location, $q, flash, $state, $stateParams, me, siteSocket, principal, userFactory, livePostFactory, $rootScope) {
    $scope.livePosts = [];
    $scope.userFactory = userFactory;
    $scope.groups = me.groups;
    $scope.Date = Date;
    $scope.groups = me.groups;
    $scope.currGroup = null;
    $scope.me = me;

    $scope.courseSearch = {
        selectedCourse: "",
        courses: [],
        departments: [],
        selectedDepartment: ""
    };

    $http({
        url: '/api/departments',
        method: 'GET'
    }).success(function(data) {
        $scope.courseSearch.departments = data.departments;
    });


    $scope.getCoursesForDepartment = function(selectedDepartment) {
        $http({
            url: '/api/courses',
            method: 'GET',
            params: {
                department: selectedDepartment
            }
        }).success(function(data) {
            $scope.courseSearch.courses = data.courses;
        })

    };


    $scope.$watch('courseSearch.selectedDepartment', function(newval, oldval) {
        if (newval != "") {
            $scope.getCoursesForDepartment(newval);
        }
    });


    $scope.setCurrentComment = function(child) {
        $scope.commentTextarea.currentPostComment = child;
        child.minimizeChildren = true;
    };

    $scope.getNumberChildren = function(child) {
        if (!child.children || child.children.length == 0) {
            return 0;
        }
        var countArr = [];

        for (var i = 0; i < child.children.length; i++) {
            countArr.push($scope.getNumberChildren(child.children[i]));
        }
        var total = child.children.length;

        angular.forEach(countArr, function(count) {
            total += count;
        });

        return total;
    };

    $scope.formatDate = principal.formatDate;

    $scope.newLivePost = {
        location: "",
        classes: [],
        createdByName: me.name,
        createdBy: me._id
    };

    $scope.commentTextarea = {
        toolbar: [['bold','italics','underline','pre','quote','insertImage','insertVideo', 'ul', 'ol']],
        currentPostComment: "emptystring"
    };

    $scope.cancelComment = function() {
        $scope.commentTextarea.currentPostComment = "emptystring";
        $scope.commentTextarea.text = "";
    };

    $scope.textareaMinimize = true;

    $scope.getUser = function(item) {
        if (item) {
            if (item.createdBy == me._id) {
                item.user = {
                    name: me.name,
                    picture: me.picture,
                    email: me.email,
                    _id: me._id
                };
            } else {
                item.user = {};
                return userFactory.getUsersByIds([item.createdBy]).then(function(usersArr) {
                    item.user = usersArr[0];
                }, function(err) {
                    flash.error = err;
                    return null;
                });
            }
        }
    };

    $scope.cancelTextarea = function() {
        $scope.textareaMinimize = true;
        $scope.livePostTextarea.text = "";
    };

    $scope.submitLivePost = function() {

        if ($scope.newLivePost.location === "" || $scope.courseSearch.selectedCourse == null) {
            flash.error = 'Class and location must be present to make a post.';
        } else {
            $scope.newLivePost.classes.push($scope.courseSearch.selectedCourse);
            livePostFactory.submitNewPost($scope.newLivePost, siteSocket);
            $scope.newLivePost.location = "";
            $scope.newLivePost.classes = [];
            $scope.courseSearch.selectedCourse = "";
            $scope.courseSearch.selectedDepartment = "";

        }
    };

    $scope.submitComment = function(livePost, parent) {
        if ($scope.commentTextarea.text != "" && parent) {
            var c = {
                text: $scope.commentTextarea.text,
                livePostId: livePost._id,
                groupId: livePost.groupId,
                parentId: parent != null ? parent._id : livePost._id,
                createdBy: me._id
            };

            groupFactory.submitNewComment(c, siteSocket);

            $scope.commentTextarea.text = "";
            livePost.newCommentText = "";
            $scope.commentTextarea.currentPostComment = null;
        } else if (livePost.newCommentText) {
            var c = {
                text: livePost.newCommentText,
                livePostId: livePost._id,
                groupId: livePost.groupId,
                parentId: parent != null ? parent._id : livePost._id,
                createdBy: me._id
            };

            groupFactory.submitNewComment(c, siteSocket);

            $scope.commentTextarea.text = "";
            livePost.newCommentText = "";
            $scope.commentTextarea.currentPostComment = null;
        } else {
            flash.err = 'Empty comments cannot be posted.';
        }
    }

    siteSocket.on('new:livePost', function(livePost) {
        if ($scope.livePosts.indexOf(livePost) == -1) {
            $scope.livePosts.push(livePost);
        }
    });

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
                    $state.transitionTo('site.auth.browse.all');
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
    $scope.hideOnMobile = false;
    $scope.room = null;
    $scope.toUsers = {};
    $scope.selectedSearchCat = 'Name';
    $scope.getUrl = function() {
        return $location.path();
    };
    $scope.userInfo = {};
    $scope.rooms = allRooms;
    $scope.roomsArr = [];
    for (var i in $scope.rooms){
        $scope.roomsArr.push($scope.rooms[i]);
    }


    $scope.goToRoom = function(roomId, oldRoomId) {
        if (oldRoomId) {
            allRooms[oldRoomId].selected = false;
        } else {
            for (var r in $scope.rooms) {
                $scope.rooms[r].selected = false;
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

}]);

var navCtrl = app.controller('navCtrl', ['$scope', '$location', 'authorize', function($scope, $location, authorize) {
    $scope.status = {
        isopen: true
    };


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
    $scope.$parent.hideOnMobile = true;
    siteSocket.emit('join:room', $stateParams.roomId);
    $scope.search = "";
    $scope.toUser = {};
    $scope.message = {};
    $scope.toUserPicture = "";
    $scope.me = me;
    $scope.mePicture = "";
    $scope.roomId = $stateParams.roomId;

    for (var r in allRooms) {
        allRooms[r].selected = false;
    }
    $scope.room = allRooms[$stateParams.roomId];
    $scope.room.selected = true;

    messageFactory.setCurrentRoom($scope.roomId, $scope.me._id, siteSocket).then(function(room) {
        $scope.toUser = room.toUserArr[0];
        $scope.toUserPicture = $scope.getThumbnail($scope.toUser.picture);
        $scope.mePicture = $scope.getThumbnail($scope.me.picture);
        $scope.toUser.classesString = $scope.toUser.classes.length ? $scope.toUser.classes.join(', ') : "No classes.";
        $scope.message = {rows: 1, from: $scope.me._id, to: $stateParams.roomId, toEmail: $scope.toUser.email, text: ""};

    });



    $scope.messages = messages;

    $scope.siteSocket = siteSocket;

    $scope.getUrl = function() {
        return $location.path();
    };


    $scope.formatDate = function(date) {
        var formatted = new Date(date);
        var day = formatted.getDate();
        var month = formatted.getMonth() + 1;
        var minutes = formatted.getMinutes();
        var hours = formatted.getHours();
        var timestamp = "am";

        if (minutes < 10) {
            minutes = '0' + '' + minutes;
        }
        if (hours >= 12) {
            timestamp = "pm";
        }
        hours = hours > 12 ?  hours % 12 : hours;
        var time = hours + ':' + minutes;
        return month + '/' + day + ' @ ' + time;
    };

    $scope.getThumbnail = function(picUrl) {
        if (!picUrl || picUrl == "" || picUrl == '/img/generic_avatar.gif') return '/img/generic_avatar.gif';
        return picUrl.substring(0, picUrl.lastIndexOf('/')) + '/thumbnails' + picUrl.substring(picUrl.lastIndexOf('/'));
    };


    $scope.sendMessage = function() {
        if ($scope.message.to && $scope.message.from && $scope.message.text && $scope.message.toEmail) {
            $scope.message.createdAt = Date.now();
            siteSocket.emit('send:message', $scope.message);

            messageFactory.addMessage($scope.roomId, $scope.message, $scope.me, siteSocket).then(function(messages) {
                $scope.messages = messages;
                $scope.$parent.rooms[$scope.roomId].lastMessage = $scope.message.text;
                $scope.$parent.rooms[$scope.roomId].lastMessageCreated = $scope.message.created;
                $scope.$parent.rooms[$scope.roomId].messages = messages;

                $scope.message = {toEmail: $scope.message.toEmail, rows: 1, from: $scope.me._id, to: $scope.roomId, text: ""};
            }, function(err) {
                console.log(err);
            });

        } else if ($scope.message.text) {
            flash.error = 'An unknown error occurred. Please try again later.';
        }
    };

    $scope.evalKeypress = function(event) {
        if (event.keyCode == 13) {
            $scope.sendMessage();
            event.preventDefault();
        }
    }


}]);

app.controller('siteCtrl', ['$scope', '$location', 'principal', 'siteSocket', '$rootScope', '$state', 'messageFactory', 'userFactory', function ($scope, $location, principal, siteSocket, $rootScope, $state, messageFactory, userFactory) {
    $scope.users = {};

    $scope.setCurrentUser = function (user) {
        $scope.currentUser = user;
    };

    $scope.unreadMessages = 0;

    $rootScope.$on('updateUnreadMessages', function(event, data) {
        $scope.unreadMessages = data;
    });


    $rootScope.$on('$stateChangeError',
        function(event, toState, toParams, fromState, fromParams, error){
            console.log(event);
            console.log(error);
        });


    $scope.principal = principal;
    $scope.newMessages = 0;
    $scope.userAuthenticated = principal.isAuthenticated();

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
var groupPostDir = app.directive('groupPost', function() {
    return {

    }
});
var authInterceptor = app.factory('authInterceptor', ['$rootScope', '$q', '$cookieStore', '$location', function ($rootScope, $q, $cookieStore, $location) {
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

var authorization = app.factory('authorization', ['$rootScope', '$state', 'principal',
    function ($rootScope, $state, principal) {
        return {
            authorize: function () {
                return principal.isAuthenticated();
            }
        };
    }
])

var livePostFactory = app.factory('livePostFactory', ['$http', '$q', function($http, $q) {
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
}]);
var messageFactory = app.factory('messageFactory', ['$http', '$q', '$rootScope', 'socket', 'principal', 'userFactory', function($http, $q, $rootScope, socket, principal, userFactory) {
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
}])

var principal = app.factory('principal', ['$q', '$http', '$timeout', '$window', '$cookieStore', '$state', 'socket', 'livePostFactory',
    function ($q, $http, $timeout, $window, $cookieStore, $state, socket, livePostFactory) {
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
                            _identity.groups = {};

                            $cookieStore.put('jwt', data.token);
                            _authenticated = true;

                            livePostFactory.getGroups(_identity).then(function(groups) {
                                _identity.groups = groups;
                                deferred.resolve(_identity);
                            }, function(err) {
                                console.log(err);
                                deferred.resolve(_identity);
                            });
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
                        livePostFactory.getGroups(_identity).then(function(groups) {
                            _identity.groups = groups;
                            deferred.resolve(_identity);
                        }, function(err) {
                            console.log(err);
                            deferred.resolve(_identity);
                        });

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
            },
            formatDate: function(date) {
                if (date != null) {
                    var formatted = new Date(date);
                    var day = formatted.getDate();
                    var month = formatted.getMonth() + 1;
                    var minutes = formatted.getMinutes();
                    var hours = formatted.getHours();
                    var timestamp = "am";

                    if (minutes < 10) {
                        var temp = '0' + minutes;
                        minutes = temp;
                    }
                    if (hours >= 12) {
                        timestamp = "pm";
                    }
                    hours = hours > 12 ?  hours % 12 : hours;
                    hours = hours == 0 ? 12 : hours;

                    var time = hours + ':' + minutes;
                    return month + '/' + day + ' @ ' + time + timestamp;
                }
                return "Unknown Date";
            }
        };
    }
])

var socketF = app.factory('socket', ['$q', 'socketFactory', '$cookieStore', function ($q, socketFactory, $cookieStore) {
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

var userFactory = app.factory('userFactory', ['$http', '$q', function($http, $q) {
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
}])
