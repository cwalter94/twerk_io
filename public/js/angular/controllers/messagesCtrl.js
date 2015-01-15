var messagesCtrl = app.controller('messagesCtrl', function($scope, $http, $location, flash, $state, siteSocket, messageFactory, me) {
    $scope.search = "";
    $scope.siteSocket = siteSocket;
    $scope.room = null;
    $scope.toUsers = {};
    $scope.selectedSearchCat = 'Name';

    $scope.getUrl = function() {
        return $location.path();
    };
    $scope.userInfo = {};
    $scope.rooms = {};

    messageFactory.getAllRooms().then(function(allRooms) {
        $scope.rooms = allRooms;
        var userIds = [];
        for (var r in $scope.rooms) {
            $scope.rooms[r].users.splice($scope.rooms[r].users.indexOf(me.id), 1)
            $scope.rooms[r].toUser = $scope.rooms[r].users[0];
            userIds = userIds.concat($scope.rooms[r].users);
        }

        messageFactory.getUserInfo(userIds).then(function(info) {
            for (var i in info) {
                $scope.userInfo[i] = info[i];
            }
            console.log($scope.userInfo);
            console.log($scope.rooms);
        })
    });

    $scope.goToRoom = function(roomId, user) {
        messageFactory.setToUsers([user]);
        console.log(roomId, user);
        $state.transitionTo('site.messages.room', {'roomId': roomId}, { reload: false, inherit: true, notify: true });

    };

    $scope.searchFocus = true;

    $scope.searchCats = ['Name', 'Email', 'Major', 'Minor', 'Status', 'Classes'];


    siteSocket.on('user:init', function(allUsers) {
        for (key in allUsers) {
            if (!angular.isUndefined(key) && $scope.users[key]) {
                $scope.users[key].online = allUsers[key];
            }
        }
    });

    siteSocket.on('user:offline', function(email) {
        if ($scope.users[email]) {
            $scope.users[email].online = false;

        }
    });

    siteSocket.on('user:online', function(email) {
        if ($scope.users[email]) {
            $scope.users[email].online = true;
        }
    });





    siteSocket.on('send:message', function(message) {
        if ($scope.room != message.to) {
            $scope.$parent.newMessages += 1;
        }

        if ($scope.messages[message.to]) {
            $scope.messages[message.to].push(message);
        } else {
            $scope.messages[message.to] = [];
            $scope.messages[message.to].push(message);
        }
        $scope.message = {rows: 1, from: $scope.me.id, to: $scope.room};
    });

    siteSocket.on('join:room', function(room) {
        console.log("joined " + room);
        $scope.room = room;
        $scope.message = {rows: 1, from: $scope.me.id, to: $scope.room, toEmail: $scope.message.toEmail};
    });

});
