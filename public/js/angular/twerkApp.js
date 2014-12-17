var app = angular.module('duApp', ['ui.mask', 'ngAnimate', 'ui.select', 'angularFileUpload', 'ui.bootstrap', 'ngSanitize',
    'mgcrea.ngStrap', 'textAngular',  'xeditable','angular-flash.service', 'angular-flash.flash-alert-directive', 'ui.router'], function() {

});

app.config(function(uiSelectConfig, flashProvider, $stateProvider, $urlRouterProvider, $locationProvider) {
    uiSelectConfig.theme = 'selectize';
    $locationProvider.html5Mode(true).hashPrefix('!');


    flashProvider.errorClassnames.push('alert-danger');
    flashProvider.successClassnames.push('alert-success');

    $stateProvider
        .state('home', {
            url: '/',
            templateUrl: '/partials/outer/home',
            controller: 'homeCtrl',
            abstract: true,
            resolve: {
//                excomm: ['$http', function($http) {
//                    return $http.get('/api/data/home').then(function(response) {
//                        return response.data.excomm;
//                    })
//                }]
            }
        })
        .state('home.intro', {
            url: '',
            templateUrl: '/partials/inner/home/intro'
        })
        .state('home.login', {
            url: 'login',
            templateUrl: '/partials/inner/home/form-login'
        })
        .state('home.register', {
            url: 'register',
            templateUrl: '/partials/inner/home/form-register'
        })
        .state('home.verifyemail', {
            url: 'verify',
            templateUrl: '/partials/inner/home/form-verify-email'
        })
        .state('home.request', {
            url: 'request',
            abstract: true,
            templateUrl: '/partials/inner/home/form'
        })
        .state('home.request.name', {
            url: '/name',
            templateUrl: '/partials/inner/home/form-name'
        })
        .state('home.request.email', {
            url: '/email',
            templateUrl: '/partials/inner/home/form-email'
        })
        .state('home.request.phone', {
            url: '/phone',
            templateUrl: '/partials/inner/home/form-phone'

        })
        .state('home.request.details', {
            url: '/details',
            templateUrl: '/partials/inner/home/form-details'
        })
        .state('home.request.outro', {
            url: '/complete',
            templateUrl: '/partials/inner/home/outro'
        });

    $urlRouterProvider.otherwise('/');


});



app.run(function(editableOptions) {
   editableOptions.theme = 'bs3';
});