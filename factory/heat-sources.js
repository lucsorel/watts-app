'use strict';

// used to check business rules when constructing heat sources and activities
var assert = require('assert');

/**
 * Asserts that the value is a number in 0 and 24
 *
 * @param value
 * @param message
 */
function assertDayHour(value, message) {
    assert.equal(true, ('number' === typeof value) && value >= 0 && value < 24, message);
}

/**
 * Models a period of time during which a heat source is on.
 * Limitation: startHour must be inferior than endHour to ease modelling, which does
 * not fit situation when a source starts at 22h and ends at 2h the following day.
 *
 * @param startHour
 * @param endHour
 */
function Activity(startHour, endHour) {
    // business rules
    assertDayHour(startHour, 'start hour must be in [0, 24[');
    assertDayHour(endHour, 'end hour must be in [0, 24[');
    assert.equal(true, startHour < endHour, 'start hour must be inferior than end hour');

    this.startHour = startHour;
    this.endHour = endHour;
}

/**
 * Tells whether an activity is switched on
 *
 * @param hour an hour of the day as a numeric value in [0, 24[
 *
 * @return true if startHour <= hour <= endHour
 */
Activity.prototype.isOn = function (hour) {
    assertDayHour(hour, 'hour must be in [0, 24[');
    return this.startHour <= hour && hour <= this.endHour;
};

Activity.prototype.decayTime = function(inertiaDuration) {
    return Math.min(inertiaDuration, this.endHour - this.startHour);
}

/**
 * Computes the heat contribution factor of the activity at the given time. The contribution
 * factor also depends on the inertia duration, which is a characteristic of the heat source,
 * given as a parameter in this method
 *
 * @param hour
 * @param inertiaDuration
 * @return a float value between 0 (no contribution) and 1 (full contribution)
 */
Activity.prototype.heatContributionFactor = function(hour, inertiaDuration) {
    assertDayHour(hour, 'hour must be in [0, 24[');
    assert.equal(true, ('number' === typeof inertiaDuration) && 0 < inertiaDuration, 'inertia duration must be a positive number');

    var contributionFactor;
    if (this.isOn(hour)) {
        contributionFactor = Math.min(hour - this.startHour, inertiaDuration) / inertiaDuration;
    }
    else {
        // the decay time is the min between the inertia duration and the activity duration
        var decayTime = this.decayTime(inertiaDuration);

        // updates the sampling hour to account for the activity of the previous day
        if (hour < this.startHour) {
            hour += 24;
        }

        // the ratio concerning the decrease of the contribution
        var decayRatio = Math.max(0, decayTime - (hour - this.endHour)) / decayTime;

        // the max temperature may have not been reached by the source if the
        // activity time was less than the inertia duration
        var startupRatio = decayTime / inertiaDuration;
        contributionFactor = startupRatio * decayRatio;
    }

    return contributionFactor;
};

var FORMULA_TEMPLATES = {
    formula: '(START <= t and t <= END) ? IS_ON : IS_OFF',
    isOnFactor: 'min(t - START, INERTIA)/INERTIA',
    decayRatio: 'max(0, DECAY_ORIGIN - t - ((t < START) ? 24 : 0))/DECAY_TIME'
};

/**
 * Produces the formula for the heat temperature contribution factor
 *
 * @param inertiaDuration
 * @return a textual formula where t is the hour of the day in [0, 24[
 */
Activity.prototype.heatContributionFormula = function(inertiaDuration) {
    assert.equal(true, ('number' === typeof inertiaDuration) && 0 < inertiaDuration, 'inertia duration must be a positive number');
    var formula = FORMULA_TEMPLATES.formula;

    // computes the components of the contribution factor when the activity is off
    var decayTime = this.decayTime(inertiaDuration);
    var isOffFactor;
    if (decayTime < inertiaDuration) {
        isOffFactor = '(DECAY_TIME/INERTIA)*' + FORMULA_TEMPLATES.decayRatio;
    }
    else {
        isOffFactor = FORMULA_TEMPLATES.decayRatio;
    }

    // merges the values in the formula
    formula = formula.replace('IS_ON', FORMULA_TEMPLATES.isOnFactor).replace('IS_OFF', isOffFactor)
        .replace(/DECAY_TIME/g, decayTime).replace(/INERTIA/g, inertiaDuration)
        .replace(/DECAY_ORIGIN/g, decayTime + this.endHour).replace(/START/g, this.startHour).replace(/END/g, this.endHour)

    return formula;
}

/**
 * Models a heat source which contributes to the heat of its environment
 *
 * @param name the name of the source
 * @param temperature the heat it contributes to its environment
 * @param inertiaDuration the time (in hours) it takes for a source to emit its temperature, and its decay
 * @param activities an array of instances of Activity describing when the source is on
 */
function HeatSource(name, temperature, inertiaDuration, activities) {
    // business rules
    assert.equal(true, ('string' === typeof name) && name.length > 0, 'a name must be defined');
    assert.equal(true, ('number' === typeof temperature), 'temperature must be a number');
    assert.equal(true, ('number' === typeof inertiaDuration) && 0 < inertiaDuration, 'inertia duration must be a positive number');
    assert.equal(true, (Array.isArray(activities)) && activities.length > 0, 'some activities must be defined');
    activities.forEach(function(activity) {
        assert.equal(true, activity instanceof Activity, 'activity should be an instance of Activity');
    });

    this.name = name;
    this.temperature = temperature;
    this.inertiaDuration = inertiaDuration;
    this.activities = activities;
}

/**
 * Tells whether the source has some activities on or not
 *
 * @param hour an hour of the day as a numeric value in [0, 24[
 *
 * @return true if at least one of the activities is on
 */
HeatSource.prototype.isOn = function(hour) {
    // business rules
    assertDayHour(hour, 'hour must be in [0, 24[');

    return this.activities.reduce(function(isOn, activity) {
        return isOn || activity.isOn(hour);
    }, false);
};

/**
 * Computes the heat contribution of the source at the given moment by summing
 * the contribution factors of all its activities and multiplying it by the
 * source heat.
 *
 * @param hour an hour of the day as a numeric value in [0, 24[
 * @return the heat contribution of the source
 */
HeatSource.prototype.heatContribution = function(hour) {
    // business rules
    assertDayHour(hour, 'hour must be in [0, 24[');

    // multiplies the source temperature contribution by the sum of the contribution
    // factors of all the activities
    var inertiaDuration = this.inertiaDuration;
    return this.temperature * this.activities.reduce(function(contribution, activity) {
        return contribution + activity.heatContributionFactor(hour, inertiaDuration);
    }, 0);
};

/**
 * Produces the formula for the heat temperature contribution
 *
 * @return a textual formula where t is the hour of the day in [0, 24[
 */
HeatSource.prototype.heatContributionFormula = function() {
    var inertiaDuration = this.inertiaDuration,
        activitiesFormula = [];

    this.activities.forEach(function(activity) {
        activitiesFormula.push(activity.heatContributionFormula(inertiaDuration));
    });

    return this.temperature + '*((' + activitiesFormula.join(') + (') + '))'
}

module.exports = {
    Activity: Activity,
    HeatSource: HeatSource
};
