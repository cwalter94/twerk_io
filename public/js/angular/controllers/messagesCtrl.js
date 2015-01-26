var messagesCtrl = app.controller('messagesCtrl', function($scope, $http, $location, flash, $state, $stateParams, siteSocket, messageFactory, userFactory, me, allRooms) {
    $scope.search = "";
    $scope.siteSocket = siteSocket;
    $scope.hideOnMobile = false;
    $scope.room = null;
    $scope.toUsers = {};
    $scope.selectedSearchCat = 'Name';
    $scope.getUrl = function() {
        return $location.path();
    };
    $scope.userInfo = {};
    $scope.rooms = allRooms;
    $scope.roomsArr = [];
    for (var i in $scope.rooms){
        $scope.roomsArr.push($scope.rooms[i]);
    }


    $scope.goToRoom = function(roomId, oldRoomId) {
        if (oldRoomId) {
            allRooms[oldRoomId].selected = false;
        } else {
            for (var r in $scope.rooms) {
                $scope.rooms[r].selected = false;
            }
        }
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

});
