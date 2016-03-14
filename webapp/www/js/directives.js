'use strict';

// directives handling factory data
angular.module('WattsApp')
    // displays the characteristics of factory devices (heat sources)
    .component('factoryDevices', {
        templateUrl: 'templates/factory-devices.html',
        // one-way data-binding
        bindings: {
            factory: '<'
        },
        controllerAs: 'fdCtrl'
    })
    // displays the regression results
    .component('factoryAnalysis', {
        templateUrl: 'templates/factory-analysis.html',
        // one-way data-binding
        bindings: {
            factory: '<'
        },
        controllerAs: 'faCtrl'
    })
    ;
