var roomCtrl = app.controller('roomCtrl', function($scope, $http, $location, flash, $state, $stateParams, siteSocket, me, messageFactory, allRooms, messages) {
    siteSocket.emit('join:room', $stateParams.roomId);
    $scope.search = "";
    $scope.toUser = {};
    $scope.message = {};
    $scope.me = me;

    for (var r in allRooms) {
        allRooms[r].selected = false;
    }
    $scope.room = allRooms[$stateParams.roomId];
    $scope.room.selected = true;

    messageFactory.getRoomToUsers($stateParams.roomId, me).then(function(toUserArr) {
        $scope.toUser = toUserArr[0];
        $scope.toUser.classesString = $scope.toUser.classes.length ? $scope.toUser.classes.join(', ') : "No classes.";
        if ($scope.$parent.rooms[$stateParams.roomId]) {
            $scope.$parent.rooms[$stateParams.roomId].toUserArr = toUserArr;
        }
        $scope.message = {rows: 1, from: $scope.me._id, to: $stateParams.roomId, toEmail: $scope.toUser.email};
    }, function(err) {
        flash.error = err;
    });



    $scope.messages = messages;

    $scope.roomId = $stateParams.roomId;
    $scope.$parent.roomIds.push($scope.roomId);

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

    $scope.getThumbnail = function(picUrl) {
        if (!picUrl || picUrl == "" || picUrl == '/img/generic_avatar.gif') return '/img/generic_avatar.gif';
        return picUrl.substring(0, picUrl.lastIndexOf('/')) + '/thumbnails' + picUrl.substring(picUrl.lastIndexOf('/'));
    };


    $scope.sendMessage = function() {
        if ($scope.message.to && $scope.message.from && $scope.message.text && $scope.message.toEmail) {
            $scope.message.created = Date.now();
            siteSocket.emit('send:message', $scope.message);
            messageFactory.addMessage($scope.roomId, $scope.message).then(function(messages) {
                $scope.messages = messages;
                $scope.$parent.rooms[$scope.roomId].lastMessage = $scope.message.text;
                $scope.$parent.rooms[$scope.roomId].lastMessageCreated = $scope.message.created;
                $scope.$parent.rooms[$scope.roomId].messages = messages;

                $scope.message = {toEmail: $scope.message.toEmail, rows: 1, from: $scope.me._id, to: $scope.roomId};

            }, function(err) {
                console.log(err);
            });

        } else if ($scope.message.text) {
            flash.error = 'An unknown error occurred. Please try again later.';
        }
    };

    siteSocket.on('send:message', function(message) {
        if ($scope.roomId != message.to) {
            $scope.$parent.newMessages += 1;
        }

        $scope.$parent.rooms[$scope.roomId].lastMessage = message.text;
        $scope.$parent.rooms[$scope.roomId].lastMessageCreated = message.created;

        messageFactory.addMessage($scope.roomId, message).then(function(messages) {
            $scope.messages = messages;
            $scope.$parent.rooms[$scope.roomId].messageArr = messages;
        }, function(err) {
            flash.err = err;
        });
    });


});
