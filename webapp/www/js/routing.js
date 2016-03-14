'use strict';

// routing and service to highlight the menu
angular.module('WattsApp')
    .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('root', {
                abstract: true,
                url: '/',
                // makes the factory details available for the whole app
                resolve: {
                    factory: ['socketService', function(socketService) {
                        return socketService.qemit('factoryGet');
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
    // service to help navigation bar highlighting
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
    ;
