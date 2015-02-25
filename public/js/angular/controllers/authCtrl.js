var authCtrl = app.controller('authCtrl', function ($scope, $state, $rootScope, me, siteSocket, userFactory, messageFactory, groupFactory, allRooms) {


    siteSocket.emit('user:init', me._id);
    siteSocket.on('user:init', function(userOnlineStatus) {
        userFactory.allUserOnlineStatus(userOnlineStatus);

    });

    var temp = [];
    for (var r in allRooms) {
        temp.push(r);
    }
    siteSocket.emit('join:room:arr', temp);


    messageFactory.getUnreadMessages(me._id).then(function(unreadMessages) {
        $rootScope.$emit('updateUnreadMessages', unreadMessages);
    });

    siteSocket.on('new:room', function(roomId) {
        console.log("NEW ROOM ", roomId);
        messageFactory.addRoom(roomId).then(function(room) {
            siteSocket.emit('join:room:arr', [roomId]);
        });
    });

    siteSocket.on('user:offline', function(userId) {
        userFactory.userOffline(userId).then(function(data) {

        }, function(err) {

        })
    });

    siteSocket.on('user:online', function(userId) {
        userFactory.userOnline(userId).then(function(data) {

        }, function(err) {

        })
    });



    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, err) {
        if (toState.name.indexOf('site.auth.messages.room') == -1) {
            messageFactory.setCurrentRoom(null, null, siteSocket).then(function(currRoom) {

            });
        }
    });

    siteSocket.on('send:message', function(message) {
        messageFactory.addMessage(message.to, message, me._id, siteSocket);
    });

    siteSocket.on('new:groupPost', function(groupPost) {

        groupFactory.addNewPost(groupPost).then(function(groupPost) {
            $rootScope.$broadcast('new:groupPost', groupPost);
        }, function(err) {
            console.log(err);
        })
    });

    siteSocket.on('new:comment', function(comment) {
        groupFactory.addNewComment(comment);
    })



});