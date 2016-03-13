'use strict';

// filters used to format values
angular.module('WattsApp')
    // round percentages
    .filter('percentage', function() {
        return function(input) {
            if (isNaN(input)) {
                return input;
            }
            return Math.floor(input * 100) + '%';
        };
    })
    // displays the time frame ogf the activity
    .filter('activity', function() {
        return function(activity) {
            if (('object' !== typeof activity) || isNaN(activity.startHour) || isNaN(activity.endHour)) {
                return activity;
            }

            return activity.startHour + '-' + activity.endHour + 'h  ';
        };
    })
    // decorates the laps sample property with nice labels
    .filter('sampleKey', function() {
        return function(property) {
            switch (property) {
                case 'meanT':
                    return 'mean (°C)';
                case 'stdD':
                    return '± dev. (°C)';
                case 'nbSamples':
                    return 'samples';
                default:
                    return property;
            }
        };
    })
    // decorates the values of the lapse samples (implies ng-sanitize)
    .filter('valueKey', ['$filter', function($filter) {
        return function(value, property) {
            switch (property) {
                case 'meanT':
                    return (!isNaN(value) && value > 0) ? $filter('number')(value, 2) : '';
                case 'stdD':
                    if (!isNaN(value) && value > 0) {
                        var formattedValue = $filter('number')(value, 2);
                        if (value < 1.5) {
                            return '<span class="text-success">' + formattedValue + '</span>';
                        }
                        else {
                            return '<span class="text-warning">' + formattedValue + '</span>';
                        }
                    }
                    else {
                        return '';
                    }
                default:
                    if (true === value) {
                        return '<span class="text-success">on</span>';
                    }
                    else if (false === value) {
                        return '<span class="text-danger">off</span>';
                    }
                    else {
                        return value;
                    }
            }
        };
    }])
