var principal = app.factory('principal', ['$q', '$http', '$timeout', '$window', '$cookieStore', '$state', 'socket', 'groupFactory',
    function ($q, $http, $timeout, $window, $cookieStore, $state, socket, groupFactory) {
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

                            groupFactory.getGroups(_identity).then(function(groups) {
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
                        groupFactory.getGroups(_identity).then(function(groups) {
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
