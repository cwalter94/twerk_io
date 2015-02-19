var socketF = app.factory('socket', function ($q, socketFactory, $cookieStore) {
    var _mySocket = null;

    return {

        getSocket: function() {
            var deferred = $q.defer();

            if (_mySocket != null) {
                deferred.resolve(_mySocket);
            }
            else if ($cookieStore.get('jwt')) {

                var authSocket = io.connect('', {
                    query: 'token=' + $cookieStore.get('jwt')
                });

                _mySocket = socketFactory({
                    ioSocket: authSocket
                });

                deferred.resolve(_mySocket);

            } else {
                deferred.reject("Socket auth failed");
            }
            return deferred.promise;
        }
    }

})
