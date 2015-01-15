var messagesCtrl = app.controller('messagesCtrl', function($scope, $http, $location, flash, $state, socket) {
    $scope.search = "";
    $scope.socket = socket;
    $scope.room = null;

    $scope.selectedSearchCat = 'Name';

    $scope.getUrl = function() {
        return $location.path();
    };

    $scope.searchFocus = true;

    $scope.searchCats = ['Name', 'Email', 'Major', 'Minor', 'Status', 'Classes'];


    socket.on('user:init', function(allUsers) {
        for (key in allUsers) {
            if (!angular.isUndefined(key) && $scope.users[key]) {
                $scope.users[key].online = allUsers[key];
            }
        }
    });

    socket.on('user:offline', function(email) {
        if ($scope.users[email]) {
            $scope.users[email].online = false;

        }
    });

    socket.on('user:online', function(email) {
        if ($scope.users[email]) {
            $scope.users[email].online = true;
        }
    });





    socket.on('send:message', function(message) {
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

    socket.on('join:room', function(room) {
        console.log("joined " + room);
        $scope.room = room;
        $scope.message = {rows: 1, from: $scope.me.id, to: $scope.room, toEmail: $scope.message.toEmail};
    });

});
