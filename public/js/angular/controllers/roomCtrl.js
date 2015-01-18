var roomCtrl = app.controller('roomCtrl', function($scope, $http, $location, flash, $state, $stateParams, siteSocket, me, messageFactory, allRooms, messages) {

    $scope.search = "";
    $scope.toUser = {};
    $scope.message = {};
    $scope.me = me;
    $scope.room = allRooms[$stateParams.roomId];

    messageFactory.getRoomToUsers($stateParams.roomId, me).then(function(toUsersArr) {
        $scope.toUser = toUsersArr[0];
        $scope.toUser.classesString = $scope.toUser.classes.length ? $scope.toUser.classes.join(', ') : "No classes.";
        console.log($scope.toUser);
        $scope.message = {rows: 1, from: $scope.me._id, to: $stateParams.roomId, toEmail: $scope.toUser.email};
    }, function(err) {
        flash.error = err;
    });

    $scope.messages = messages;

    $scope.roomId = $stateParams.roomId;

    $scope.siteSocket = siteSocket;

    $scope.getUrl = function() {
        return $location.path();
    };

    $scope.formatDate = function(dateString) {
        var date = new Date(dateString);
        return {
            year : date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            time: date.getHours() + ":" + date.getMinutes()
        }
    };


    $scope.sendMessage = function() {
        if ($scope.message.to && $scope.message.from && $scope.message.text && $scope.message.toEmail) {
            $scope.message.created = Date.now();
            siteSocket.emit('send:message', $scope.message);
            messageFactory.addMessage($scope.roomId, $scope.message).then(function(messages) {
                $scope.messages = messages;
                $scope.$parent.rooms[$scope.roomId].lastMessage = $scope.message.text;
                $scope.$parent.rooms[$scope.roomId].lastMessageCreated = $scope.message.created;
                $scope.message = {toEmail: $scope.message.toEmail, rows: 1, from: $scope.me._id, to: $scope.roomId};

            }, function(err) {
                console.log(err);
            });

        } else if ($scope.message.text) {
            flash.error = 'An unknown error occurred. Please try again later.';
        }
    };


});
