var authorization = app.factory('authorization', ['$rootScope', '$state', 'principal',
    function ($rootScope, $state, principal) {
        return {
            authorize: function () {
                return principal.isAuthenticated();
            }
        };
    }
])
