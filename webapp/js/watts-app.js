'use strict';

angular.module('WattsApp', ['ui.router', 'SocketAPI'])
// routing
    .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('root', {
                abstract: true,
                url: '/',
                // makes the factory details available for the whole app
                resolve: {
                    factory: ['socketAPI', function(socketAPI) {
                        return socketAPI.qemit('factory.get');
                    }]
                },
                templateUrl: 'templates/root.html',
                controller: 'NavigationController as navCtrl'
            })
            .state('root.factory', {
                url: 'factory',
                resolve: {
                    page: ['navigationService', function(navigationService) {
                        return navigationService.setViewName('factory');
                    }]
                },
                views: {
                    'factory': {
                        templateUrl: 'templates/factory.html',
                        controller: 'FactoryController as factoryCtrl'
                    }
                }
            })
            .state('root.contact', {
                url: 'contact',
                resolve: {
                    page: ['navigationService', function(navigationService) {
                        return navigationService.setViewName('contact');
                    }]
                },
                views: {
                    'contact': {
                        templateUrl: 'templates/contact.html'
                    }
                }
            })
            ;

        $urlRouterProvider.otherwise('/factory');
    }])
    .service('navigationService', ['$q', function($q) {
        var navigationService = {
            page: { name: null }
        };
        navigationService.setViewName = function(name) {
            this.page.name = name;
            return $q.when(name);
        };

        return navigationService;
    }])

    .controller('NavigationController', ['factory', 'navigationService', function(factory, navigationService) {
        var ctrl = this;
        ctrl.factory = factory;
        ctrl.page = navigationService.page;
        ctrl.setViewName = navigationService.setViewName;
    }])
    .controller('FactoryController', ['factory', 'socketAPI', function(factory, socketAPI) {
        // navigationService.setViewName('factory');
        var ctrl = this;
        ctrl.factory = factory;
    }])

;
