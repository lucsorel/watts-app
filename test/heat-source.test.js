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
                new HeatSource('furnace', 16, 0, [morningActivity, afternoonActivity]);
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

    describe('# heatContribution()', function() {
        it('should return the contribution of the running activity (inertia < activity)', function() {
            var morningActivity = new Activity(8, 12),
                contributionTemperature = 10,
                inertiaDuration = 1,
                furnace = new HeatSource('furnace', contributionTemperature, inertiaDuration, [morningActivity]);
            // warm-up
            assert.equal(0, furnace.heatContribution(8), 'no contribution at furnace warm-up');
            assert.equal(2.5, furnace.heatContribution(8 + (0.25 * inertiaDuration)), '1/4 contribution at furnace 1/4 inertia duration');
            assert.equal(5, furnace.heatContribution(8 + (0.5 * inertiaDuration)), 'half contribution at furnace half inertia duration');
            assert.equal(7.5, furnace.heatContribution(8 + (0.75 * inertiaDuration)), '3/4 contribution at furnace 3/4 inertia duration');
            assert.equal(contributionTemperature, furnace.heatContribution(8 + inertiaDuration), 'full contribution at furnace inertia duration');

            // plateau
            assert.equal(contributionTemperature, furnace.heatContribution(9.5), 'full contribution after furnace inertia duration');
            assert.equal(contributionTemperature, furnace.heatContribution(10), 'full contribution after furnace inertia duration');
            assert.equal(contributionTemperature, furnace.heatContribution(morningActivity.endHour), 'full contribution at activity end hour');

            // decay
            assert.equal(7.5, furnace.heatContribution(12 + (0.25 * inertiaDuration)), '3/4 contribution after end hour + 1/4 inertia duration');
            assert.equal(5, furnace.heatContribution(12 + (0.5 * inertiaDuration)), 'half contribution after end hour + half inertia duration');
            assert.equal(2.5, furnace.heatContribution(12 + (0.75 * inertiaDuration)), '1/4 contribution after end hour + 3/4 inertia duration');
            assert.equal(0, furnace.heatContribution(12 + inertiaDuration), 'no contribution after end hour + inertia duration');
        });

        it('should return the contribution of the running activity (inertia > activity)', function() {
            var morningActivity = new Activity(8, 9),
                contributionTemperature = 10,
                inertiaDuration = 2,
                furnace = new HeatSource('furnace', contributionTemperature, inertiaDuration, [morningActivity]);
            // warm-up
            assert.equal(0, furnace.heatContribution(8), 'no contribution at furnace warm-up');
            assert.equal(1.25, furnace.heatContribution(8.25), 'partial contribution during inertia duration');
            assert.equal(2.5, furnace.heatContribution(8.5), 'partial contribution during inertia duration');
            assert.equal(3.75, furnace.heatContribution(8.75), 'partial contribution during inertia duration');
            assert.equal(5, furnace.heatContribution(9), 'partial contribution at end hour');

            // decay
            assert.equal(2.5, furnace.heatContribution(9.5), 'partial contribution after end hour');
            assert.equal(0, furnace.heatContribution(10), 'no contribution after end hour + half inertia duration');
        });

        it('should sum activity contributions (within a day)', function() {
            var morningActivity = new Activity(10, 12.5),
                // noon warm-up overlaps morning activity
                noonActivity = new Activity(12, 14),
                // noon decay overlaps afternoon activity
                afternoonActivity = new Activity(14.5, 16),
                inertiaDuration = 1,
                furnace = new HeatSource('furnace', 10, inertiaDuration, [morningActivity, noonActivity, afternoonActivity]);

            // morning activity starts
            assert.equal(0, furnace.heatContribution(10), 'no contribution at morning warm-up');
            assert.equal(5, furnace.heatContribution(10.5), 'half contribution at half morning warm-up');
            assert.equal(10, furnace.heatContribution(11), 'full contribution of morning activity');

            // noon starts while morning runs and decays
            assert.equal(10, furnace.heatContribution(12), 'full contribution of morning activity at noon start-up');
            assert.equal(15, furnace.heatContribution(12.5), 'full+half contribution of morning activity at half noon warm-up');

            // noon runs and decays
            assert.equal(15, furnace.heatContribution(13), 'full+half contribution of noon and half decaying morning activity');
            assert.equal(10, furnace.heatContribution(13.5), 'full contribution of noon');
            assert.equal(10, furnace.heatContribution(14), 'full contribution of noon end hour');

            // noon decays while afternoon starts
            assert.equal(5, furnace.heatContribution(14.5), 'half contribution of decaying noon at afternoon start-up');

            // afternoon activity only
            assert.equal(5, furnace.heatContribution(15), 'half contribution of afternoon warm-up');
            assert.equal(10, furnace.heatContribution(15.5), 'full contribution of afternoon activity');
            assert.equal(10, furnace.heatContribution(16), 'full contribution at afternoon end hour');
            assert.equal(5, furnace.heatContribution(16.5), 'half contribution of decaying afternoon activity');
            assert.equal(0, furnace.heatContribution(17), 'no contribution of activities');
        });

        it('should sum activity contributions (across 2 days)', function() {
            var morningActivity = new Activity(1, 10),
                // evening decay overlaps morning activity
                eveningActivity = new Activity(16, 23),
                inertiaDuration = 4,
                furnace = new HeatSource('furnace', 10, inertiaDuration, [morningActivity, eveningActivity]);

            // decay of evening activity
            assert.equal(10, furnace.heatContribution(22), 'full contribution of evening activity');
            assert.equal(10, furnace.heatContribution(23), 'full contribution at evening stop hour');
            assert.equal(8.75, furnace.heatContribution(23.5), 'partial contribution during evening decay');
            assert.equal(7.5, furnace.heatContribution(0), 'partial contribution during evening decay');
            assert.equal(6.25, furnace.heatContribution(0.5), 'partial contribution during evening decay');

            // decay of evening activity while morning activity starts
            assert.equal(5, furnace.heatContribution(1), 'partial contribution at morning activity start-up');
            assert.equal(5, furnace.heatContribution(1.5), 'partial contribution of morning warm-up during evening decay');
            assert.equal(5, furnace.heatContribution(3), 'partial contribution of morning warm-up whithout evening decay');
            assert.equal(7.5, furnace.heatContribution(4), 'partial contribution of morning warm-up');
            assert.equal(10, furnace.heatContribution(5), 'full contribution of morning activity');
            assert.equal(10, furnace.heatContribution(6), 'full contribution of morning activity');
        });
    });
});
