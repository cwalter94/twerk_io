var messagesCtrl = app.controller('messagesCtrl', function($scope, $http, $location, flash, $state, socket, rooms, me) {
    $scope.users = {};
    $scope.search = "";
    $scope.messageButtons = null;

    $scope.getUsers = function() {
        return $http.get('/api/browse')
            .then(function(response) {
                var temp = response.data.users;
                var results = {};
                for (var i = 0; i < temp.length; i++) {
                    var elem = temp[i];
                    $scope.users[elem.email] = elem;
                }
                return results;
            });
    };

    $scope.me = me;
    $scope.socket = socket;
    $scope.room = null;

    $scope.selectedSearchCat = 'Name';

    $scope.getUrl = function() {
        return $location.path();
    };

    $scope.messages = {};

    $scope.message = {rows: 1, from: $scope.me.id, to: $scope.room, toEmail: ''};
    $scope.searchFocus = true;

    $scope.searchCats = ['Name', 'Email', 'Major', 'Minor', 'Status', 'Classes'];

    $scope.quickMessage = function(user) {
        $scope.message.toEmail = user.email;
        $state.transitionTo('site.browse.quickMessage', {id: user._id}, { reload: false, inherit: true, notify: true });
    };


    socket.emit('user:init', $scope.me.email);

    socket.on('user:init', function(allUsers) {
        console.log(allUsers);
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



    $scope.sendMessage = function() {
        console.log($scope.message);
        if ($scope.message.to && $scope.message.from && $scope.message.text && $scope.message.toEmail) {

            socket.emit('send:message', $scope.message);
            if ($scope.messages[$scope.message.to]) {
                $scope.messages[$scope.message.to].push($scope.message);
            } else {
                $scope.messages[$scope.message.to] = [];
                $scope.messages[$scope.message.to].push($scope.message);
            }
            $scope.message = {toEmail: $scope.message.toEmail, rows: 1, from: $scope.me.id, to: $scope.room};

        } else if ($scope.message.text) {
            flash.error = 'An unknown error occurred. Please try again later.';
        }
    };

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
