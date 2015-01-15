var roomCtrl = app.controller('roomCtrl', function($scope, $http, $location, flash, $state, $stateParams, socket, me, messageFactory, toUser) {

    $scope.search = "";

    $scope.roomId = $stateParams.roomId;
    $scope.toUser = toUser;
    $scope.toUser.classesString = $scope.toUser.classes.length ? $scope.toUser.classes.join(', ') : "No classes.";
    $scope.me = me;

    $scope.socket = socket;
    $scope.room = null;

    $scope.selectedSearchCat = 'Name';

    $scope.getUrl = function() {
        return $location.path();
    };

    $scope.messages = {};

    $scope.message = {rows: 1, from: $scope.me._id, to: $scope.roomId, toEmail: $scope.toUser.email};
    $scope.searchFocus = true;

    $scope.searchCats = ['Name', 'Email', 'Major', 'Minor', 'Status', 'Classes'];




    socket.on('user:offline', function(email) {
        if (email == $scope.toUser.email) {
            $scope.toUser.online = false;
        }
    });

    socket.on('user:online', function(email) {
        if (email == $scope.toUser.email) {
            $scope.toUser.online = false;
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

});
