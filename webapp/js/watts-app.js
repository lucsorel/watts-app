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
    .filter('percentage', function() {
        return function(input) {
            if (isNaN(input)) {
                return input;
            }
            return Math.floor(input * 100) + '%';
        };
    })

    .filter('activity', function() {
        return function(activity) {
            if (('object' !== typeof activity) || isNaN(activity.startHour) || isNaN(activity.endHour)) {
                return activity;
            }

            return activity.startHour + '-' + activity.endHour + 'h  ';
        };
    })
    // navigation controller
    .controller('NavigationController', ['factory', 'navigationService', function(factory, navigationService) {
        var ctrl = this;
        ctrl.factory = factory;
        ctrl.page = navigationService.page;
    }])
    // factory details controller
    .controller('FactoryController', ['factory', 'socketAPI', function(factory, socketAPI) {
        var ctrl = this;
        ctrl.factory = factory;

        // draws the factory temperature plot
        try {
            functionPlot({
                target: '#factoryTemperaturePlot',
                disableZoom: true,
                xDomain: [0, 24],
                yDomain: [10, 24],
                data: [{
                    range: [0, 24],
                    fn: math.eval(factory.formula)
                }]
            });
        }
        catch (err) {
            console.log(err);
            alert(err);
        }
    }])

;
