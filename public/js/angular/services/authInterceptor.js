var authInterceptor = app.factory('authInterceptor', function ($rootScope, $q, $cookieStore, $location) {
    return {
        request: function (config) {
            if (config.url.indexOf('http://maps.googleapis.com/maps/api/geocode/json?') > -1
                || config.url.indexOf('apis-dev.berkeley.edu') > -1) return config;

            config.headers = config.headers || {};

            if ($cookieStore.get('jwt')) {
                config.headers.Authorization = 'Bearer ' + $cookieStore.get('jwt');
            }
            return config;
        },
        response: function (response) {
            if (response.status === 401) {

            }

            if (response.token != null) {
                $cookieStore.set('jwt', response.token);
            }
            return response || $q.when(response);
        }
    };
})
