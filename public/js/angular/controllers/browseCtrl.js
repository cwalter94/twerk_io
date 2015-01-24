var browseCtrl = app.controller('browseCtrl', function($scope, $http, $location, flash, $state, me, users, usersObj, siteSocket, principal, messageFactory, userFactory) {

    $scope.users = usersObj;
    $scope.search = "";
    $scope.messageButtons = null;
    $scope.usersList = users;
    $scope.sortBy = 'lastOnline';
    $scope.busy = false;

    $scope.me = me;


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

    $scope.formatDate = function(date) {
        var formatted = new Date(date);
        var day = formatted.getDate();
        var month = formatted.getMonth() + 1;
        var time = formatted.getHours() + ':' + formatted.getMinutes();
        return month + '/' + day + ' @ ' + time;
    };

    siteSocket.on('update:status', function(data) {
        userFactory.updateUserStatus(data.userId, data.status, data.statusCreated).then(function(user) {
            console.log("USER", user);
            console.log($scope.users);
            $scope.users[user._id].status = user.status;
            $scope.users[user._id].statusCreated = user.statusCreated;

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
            for (var i = 0; i <  usersArr.length; i++) {
                var elem = usersArr[i];
                if ($scope.users[elem._id] == null) {
                    $scope.users[elem._id] = elem;
                    $scope.usersList.push(elem);
                }
            }
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

});
