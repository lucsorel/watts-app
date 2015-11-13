'use strict';

var assert = require('assert'),
    HeatSources = require('../factory/heat-sources.js'),
    HeatSource = HeatSources.HeatSource,
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

describe('HeatSource', function() {
    describe('# construction', function() {
        var morningActivity = new Activity(10, 12),
            afternoonActivity = new Activity(14, 16);

        it('should construct with valid parameters', function() {
            var furnace = new HeatSource('furnace', 25.5, 1, [morningActivity, afternoonActivity]);
            assert.equal('furnace', furnace.name, 'heat source name');
            assert.equal(25.5, furnace.temperature, 'heat source temperature');
            assert.equal(1, furnace.inertiaDuration, 'heat source inertia duration');
            assert.equal(2, furnace.activities.length, 'heat source activities count');
            assert.equal(morningActivity, furnace.activities[0], 'heat source 1st activity');
            assert.equal(afternoonActivity, furnace.activities[1], 'heat source 2nd activity');
        });

        it('should fail with an invalid name', function() {
            assert.throwMessage(function() {
                new HeatSource(undefined, 25.5, 1, [morningActivity, afternoonActivity]);
            }, 'a name must be defined');
            assert.throwMessage(function() {
                new HeatSource(null, 25.5, 1, [morningActivity, afternoonActivity]);
            }, 'a name must be defined');
            assert.throwMessage(function() {
                new HeatSource('', 25.5, 1, [morningActivity, afternoonActivity]);
            }, 'a name must be defined');
        });

        it('should fail with an invalid temperature', function() {
            assert.throwMessage(function() {
                new HeatSource('furnace', undefined, 1, [morningActivity, afternoonActivity]);
            }, 'temperature must be a number');
            assert.throwMessage(function() {
                new HeatSource('furnace', null, 1, [morningActivity, afternoonActivity]);
            }, 'temperature must be a number');
            assert.throwMessage(function() {
                new HeatSource('furnace', '20', 1, [morningActivity, afternoonActivity]);
            }, 'temperature must be a number');
        });

        it('should fail with an invalid inertia duration', function() {
            assert.throwMessage(function() {
                new HeatSource('furnace', 16, undefined, [morningActivity, afternoonActivity]);
            }, 'inertia duration must be a positive number');
            assert.throwMessage(function() {
                new HeatSource('furnace', 16, null, [morningActivity, afternoonActivity]);
            }, 'inertia duration must be a positive number');
            assert.throwMessage(function() {
                new HeatSource('furnace', 16, '1', [morningActivity, afternoonActivity]);
            }, 'inertia duration must be a positive number');
            assert.throwMessage(function() {
                new HeatSource('furnace', 16, -1, [morningActivity, afternoonActivity]);
            }, 'inertia duration must be a positive number');
        });

        it('should fail with invalid activites', function() {
            assert.throwMessage(function() {
                new HeatSource('furnace', 16, 1, undefined);
            }, 'some activities must be defined');
            assert.throwMessage(function() {
                new HeatSource('furnace', 16, 1, null);
            }, 'some activities must be defined');
            assert.throwMessage(function() {
                new HeatSource('furnace', 16, 1, {});
            }, 'some activities must be defined');
            assert.throwMessage(function() {
                new HeatSource('furnace', 16, 1, [morningActivity, {startHour: 12, endHour: 16}]);
            }, 'activity should be instance of Activity');
        });
    });

    describe('# isOn()', function() {
        it('should be true when at least one activity is on', function() {
            var morningActivity = new Activity(10, 12),
                afternoonActivity = new Activity(14, 16);
            var furnace = new HeatSource('furnace', 25.5, 1, [morningActivity, afternoonActivity]);

            assert.equal(true, furnace.isOn(10), 'first activity is on');
            assert.equal(true, furnace.isOn(11), 'first activity is on');
            assert.equal(true, furnace.isOn(12), 'first activity is on');

            assert.equal(true, furnace.isOn(14), 'second activity is on');
            assert.equal(true, furnace.isOn(15.5), 'second activity is on');
            assert.equal(true, furnace.isOn(16), 'second activity is on');
        });

        it('should be true with overlapping on activities', function() {
            var morningActivity = new Activity(10, 13),
                afternoonActivity = new Activity(12, 16);
            var furnace = new HeatSource('furnace', 25.5, 1, [morningActivity, afternoonActivity]);

            assert.equal(true, furnace.isOn(11), 'first activity is on');
            assert.equal(true, furnace.isOn(12), 'both activities on');
            assert.equal(true, furnace.isOn(13), 'both activities on');
            assert.equal(true, furnace.isOn(14), 'both activities on');
            assert.equal(true, furnace.isOn(12), 'first activity is on');
            assert.equal(true, furnace.isOn(14), 'second activity is on');
        });

        it('should be false when no activity is on', function() {
            var morningActivity = new Activity(10, 12),
                afternoonActivity = new Activity(14, 16);
            var furnace = new HeatSource('furnace', 25.5, 1, [morningActivity, afternoonActivity]);

            assert.equal(false, furnace.isOn(9.99), 'before first activity');
            assert.equal(false, furnace.isOn(12.01), 'after first activity');
            assert.equal(false, furnace.isOn(13.99), 'before second activity');
            assert.equal(false, furnace.isOn(16.01), 'after second activity');
        });
    });
});
