var roomCtrl = app.controller('roomCtrl', function($scope, $http, $location, flash, $state, $stateParams, siteSocket, me, messageFactory, toUser) {

    $scope.search = "";

    $scope.roomId = $stateParams.roomId;
    $scope.toUser = toUser;
    $scope.toUser.classesString = $scope.toUser.classes.length ? $scope.toUser.classes.join(', ') : "No classes.";
    $scope.me = me;

    $scope.siteSocket = siteSocket;
    $scope.room = null;

    $scope.selectedSearchCat = 'Name';

    $scope.getUrl = function() {
        return $location.path();
    };

    messageFactory.getRoom($scope.roomId).then(function(room) {
        $scope.room = room;
        console.log($scope.room);
    });

    $scope.message = {rows: 1, from: $scope.me.id, to: $scope.roomId, toEmail: $scope.toUser.email};
    $scope.searchFocus = true;

    $scope.searchCats = ['Name', 'Email', 'Major', 'Minor', 'Status', 'Classes'];


    $scope.formatDate = function(dateString) {
        var date = new Date(dateString);

        return {
            year : date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            time: date.getHours() + ":" + date.getMinutes()
        }
    };

    siteSocket.on('user:offline', function(email) {
        if (email == $scope.toUser.email) {
            $scope.toUser.online = false;
        }
    });

    siteSocket.on('user:online', function(email) {
        if (email == $scope.toUser.email) {
            $scope.toUser.online = false;
        }
    });



    $scope.sendMessage = function() {
        if ($scope.message.to && $scope.message.from && $scope.message.text && $scope.message.toEmail) {
            $scope.message.created = Date.now();
            siteSocket.emit('send:message', $scope.message);
            $scope.room.messages.push($scope.message);
            $scope.message = {toEmail: $scope.message.toEmail, rows: 1, from: $scope.me.id, to: $scope.roomId};

        } else if ($scope.message.text) {
            flash.error = 'An unknown error occurred. Please try again later.';
        }
    };

    siteSocket.on('send:message', function(message) {

        if ($scope.room != message.to) {
            $scope.$parent.newMessages += 1;
        } else {
            $scope.room.messages.push(message);
        }

    });

});
