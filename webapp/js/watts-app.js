'use strict';

angular.module('WattsApp', ['ngSanitize', 'ui.router', 'SocketAPI'])
    // routing
    .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('root', {
                abstract: true,
                url: '/',
                // makes the factory details available for the whole app
                resolve: {
                    factory: ['socketAPI', function(socketAPI) {
                        return socketAPI.qemit('factoryGet');
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
    // navigation controller
    .controller('NavigationController', ['factory', 'navigationService', function(factory, navigationService) {
        var ctrl = this;
        ctrl.factory = factory;
        ctrl.page = navigationService.page;
    }])
    // factory details controller
    .controller('FactoryController', ['$scope', 'factory', 'socketAPI', function($scope, factory, socketAPI) {
        var ctrl = this;
        ctrl.factory = factory;

        // draws the factory temperature plot
        try {
            functionPlot({
                target: '#factoryTemperaturePlot',
                disableZoom: true,
                xDomain: [0, 24],
                yDomain: [10, 22],
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

        // flags the properties of the lapse samples to display them column-wise
        ctrl.lapseSampleKeys = ['timeslot', 'meanT', 'stdD', 'nbSamples'];
        factory.heatSources.forEach(function(factoryHeatSource) {
            ctrl.lapseSampleKeys.push(factoryHeatSource.heatSource.name);
        });

        // flags the map-reduced samples
        ctrl.lapseSamples = [];
        ctrl.onSampleUpdate = function(updatedLapseSample) {
            // transforms the laps sample
            updatedLapseSample.stdD = Math.sqrt(updatedLapseSample.meanSquares - Math.pow(updatedLapseSample.meanT, 2));
            delete updatedLapseSample.meanSquares;
            updatedLapseSample.statusesOn.forEach(function(device) {
                updatedLapseSample[device] = true;
            });
            updatedLapseSample.statusesOff.forEach(function(device) {
                updatedLapseSample[device] = false;
            });

            // adds or replace the lapse sample
            var index = ctrl.lapseSamples.reduce(function(indexToUpdate, lapseSample, index) {
                return (lapseSample.id === updatedLapseSample.id) ? index : indexToUpdate;
            }, -1);
            if (-1 === index) {
                ctrl.lapseSamples.push(updatedLapseSample);
            }
            else {
                ctrl.lapseSamples[index] = updatedLapseSample;
            }
        }
        // updates the data when receiving updated samples
        socketAPI.on('lapseSampleUpdate', ctrl.onSampleUpdate);

        ctrl.isSampling = false;
        ctrl.switchSampling = function() {
            ctrl.isSampling = !ctrl.isSampling;

            socketAPI.emit(ctrl.isSampling ? 'samplingStart' : 'samplingStop');
        }

        // stops monitoring when leaving the controller
        $scope.$on('$destroy', function() {
            if (ctrl.isSampling) {
                ctrl.switchSampling();
            }
        });
    }])
;
