var messagesCtrl = app.controller('messagesCtrl', function($scope, $http, $location, flash, $state, $stateParams, siteSocket, messageFactory, userFactory, me, allRooms) {
    $scope.search = "";
    $scope.siteSocket = siteSocket;
    $scope.room = null;
    $scope.toUsers = {};
    $scope.selectedSearchCat = 'Name';
    $scope.getUrl = function() {
        return $location.path();
    };
    $scope.userInfo = {};
    $scope.rooms = allRooms;
    $scope.roomsArr = [];

    var roomIds = [];
    for (var r in allRooms) {
        if (allRooms[r].messages.length > 0) {
            roomIds.push(r);
        }
        $scope.roomsArr.push($scope.rooms[r]);
    }
    if (roomIds.length > 0) {
        messageFactory.getMultipleRoomsToUsers(roomIds, me)
            .then(function(roomsIdsToUserArr) {
                for (var r in roomsIdsToUserArr) {
                    $scope.rooms[r].toUserArr = roomsIdsToUserArr[r];
                }
                console.log($scope.rooms);
            }, function(err) {
                console.log(err);
            });
    }

    $scope.goToRoom = function(roomId) {
        console.log(roomId);
        $state.transitionTo('site.auth.messages.room', {'roomId': roomId}, { reload: false, inherit: true, notify: true });
    };
    $scope.getThumbnail = function(picUrl) {
        if (!picUrl || picUrl == "" || picUrl == '/img/generic_avatar.gif') return '/img/generic_avatar.gif';
        return picUrl.substring(0, picUrl.lastIndexOf('/')) + '/thumbnails' + picUrl.substring(picUrl.lastIndexOf('/'));
    };

    siteSocket.on('user:init', function(allUsers) {
        for (key in allUsers) {
            if (!angular.isUndefined(key) && $scope.users[key]) {
                $scope.users[key].online = allUsers[key];
            }
        }
    });



    siteSocket.on('send:message', function(message) {
        if ($scope.room != message.to) {
            $scope.$parent.newMessages += 1;
        }
        messageFactory.addMessage(message);
    });

});
