'use strict';

var assert = require('assert'),
    HeatSources = require('../factory/heat-sources.js'),
    Activity = HeatSources.Activity;

// adds an assertion utility for thrown errors
assert.throwMessage = function(test, message, logErrorMessage) {
    assert.throws(test, function(error) {
        if (true === logErrorMessage) {
            console.log(error.toString());
        }

        assert.equal(true, error.toString().indexOf(message) > -1, 'error message must contain ' + message);
        return true;
    });
}

describe('Activity', function() {
    describe('# construction', function() {
        it('should work with number values, startHour < endHour', function() {
            var activity = new Activity(0.1, 23.99);
            assert.equal(0.1, activity.startHour);
            assert.equal(23.99, activity.endHour);
        });
        it('should fail if start hour not numeric nor between 0 and 24', function() {
            assert.throwMessage(
                function() {new Activity(24, 22);},
                'start hour must be in [0, 24[');
            assert.throwMessage(
                function() {new Activity(-0.1, 22);},
                'start hour must be in [0, 24[');
            assert.throwMessage(
                function() {new Activity('20', 22);},
                'start hour must be in [0, 24[');
            assert.throwMessage(
                function() {new Activity(undefined, 22);},
                'start hour must be in [0, 24[');
            assert.throwMessage(
                function() {new Activity(null, 22);},
                'start hour must be in [0, 24[');
        });
        it('should fail with end hour not numeric nor between 0 and 24', function() {
            assert.throwMessage(
                function() {new Activity(2, 24);},
                'end hour must be in [0, 24[');
            assert.throwMessage(
                function() {new Activity(2, -0.1);},
                'end hour must be in [0, 24[');
            assert.throwMessage(
                function() {new Activity(2, '10');},
                'end hour must be in [0, 24[');
            assert.throwMessage(
                function() {new Activity(2, undefined);},
                'end hour must be in [0, 24[');
            assert.throwMessage(
                function() {new Activity(2, null);},
                'end hour must be in [0, 24[');
        });
        it('should fail with start hour superior than end hour', function() {
            assert.throwMessage(
                function() {new Activity(20, 3);},
                'start hour must be inferior than end hour');
        });
    });

    describe('# isOn()', function() {
        var activity = new Activity(10.5, 11.5);

        it('should return true when testing between the start and the end hours', function() {
            assert.equal(true, activity.isOn(10.5));
            assert.equal(true, activity.isOn(11));
            assert.equal(true, activity.isOn(11.5));
        });

        it('should return false when testing between the start and the end hours', function() {
            assert.equal(false, activity.isOn(10.49));
            assert.equal(false, activity.isOn(11.51));
        });
        it('should fail when hour is neither numeric nor between 0 and 24', function() {
            assert.throwMessage(
                function() {activity.isOn(undefined);},
                'hour must be in [0, 24[');
            assert.throwMessage(
                function() {activity.isOn(null);},
                'hour must be in [0, 24[');
            assert.throwMessage(
                function() {activity.isOn('11');},
                'hour must be in [0, 24[');
        });
    });

    describe.only('# heatContributionFactor()', function() {
        var activity = new Activity(10, 14);

        it('# with an inertia duration shorter than the activity duration', function() {
            var inertia = 1;
            // warm-up
            assert.equal(0, activity.heatContributionFactor(10, inertia), 'no contribution at startup');
            assert.equal(0.25, activity.heatContributionFactor(10 + (0.25 * inertia), inertia), 'quarter contribution after quarter inertia duration');
            assert.equal(0.5, activity.heatContributionFactor(10 + (0.5 * inertia), inertia), 'half contribution after half inertia duration');
            assert.equal(0.75, activity.heatContributionFactor(10 + (0.75 * inertia), inertia), '3/4 contribution after 3/4 inertia duration');

            // plateau
            assert.equal(1, activity.heatContributionFactor(10 + inertia, inertia), 'max contribution at inertia duration');
            assert.equal(1, activity.heatContributionFactor(12, inertia), 'max contribution after inertia duration, before end hour');
            assert.equal(1, activity.heatContributionFactor(13, inertia), 'max contribution after inertia duration, before end hour');

            // decay
            assert.equal(1 - 0.25, activity.heatContributionFactor(14 + (0.25 * inertia), inertia), '3/4 contribution after 1/4 decay');
            assert.equal(1 - 0.5, activity.heatContributionFactor(14 + (0.5 * inertia), inertia), 'half contribution after half decay');
            assert.equal(1 - 0.75, activity.heatContributionFactor(14 + (0.75 * inertia), inertia), '3/4 contribution after 1/4 decay');
            assert.equal(0, activity.heatContributionFactor(14 + inertia, inertia), 'no contribution after end hour + inertia duration');
        });
    });
});
