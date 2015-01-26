var roomCtrl = app.controller('roomCtrl', function($scope, $http, $location, flash, $state, $stateParams, siteSocket, me, messageFactory, allRooms, messages) {
    $scope.$parent.hideOnMobile = true;
    siteSocket.emit('join:room', $stateParams.roomId);
    $scope.search = "";
    $scope.toUser = {};
    $scope.message = {};
    $scope.toUserPicture = "";
    $scope.me = me;
    $scope.mePicture = "";
    $scope.roomId = $stateParams.roomId;

    for (var r in allRooms) {
        allRooms[r].selected = false;
    }
    $scope.room = allRooms[$stateParams.roomId];
    $scope.room.selected = true;

    messageFactory.setCurrentRoom($scope.roomId, $scope.me._id, siteSocket).then(function(room) {
        $scope.toUser = room.toUserArr[0];
        $scope.toUserPicture = $scope.getThumbnail($scope.toUser.picture);
        $scope.mePicture = $scope.getThumbnail($scope.me.picture);
        $scope.toUser.classesString = $scope.toUser.classes.length ? $scope.toUser.classes.join(', ') : "No classes.";
        $scope.message = {rows: 1, from: $scope.me._id, to: $stateParams.roomId, toEmail: $scope.toUser.email, text: ""};

    });



    $scope.messages = messages;

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

            messageFactory.addMessage($scope.roomId, $scope.message, $scope.me, siteSocket).then(function(messages) {
                $scope.messages = messages;
                $scope.$parent.rooms[$scope.roomId].lastMessage = $scope.message.text;
                $scope.$parent.rooms[$scope.roomId].lastMessageCreated = $scope.message.created;
                $scope.$parent.rooms[$scope.roomId].messages = messages;

                $scope.message = {toEmail: $scope.message.toEmail, rows: 1, from: $scope.me._id, to: $scope.roomId, text: ""};
            }, function(err) {
                console.log(err);
            });

        } else if ($scope.message.text) {
            flash.error = 'An unknown error occurred. Please try again later.';
        }
    };

    $scope.evalKeypress = function(event) {
        if (event.keyCode == 13) {
            $scope.sendMessage();
            event.preventDefault();
        }
    }


});
