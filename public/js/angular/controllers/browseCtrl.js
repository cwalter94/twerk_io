var browseCtrl = app.controller('browseCtrl', function($scope, $http, $location, flash, $state, me, groups, usersObj, siteSocket, principal, messageFactory, userFactory) {

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
    $scope.groups = groups;

    $scope.formatDate = function(date) {

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

    };

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

});
