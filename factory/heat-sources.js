'use strict';

var assert = require('assert');

/**
 * Asserts that the value is a number in 0 and 24
 *
 * @param value
 * @param message
 */
function assertDayHour(value, message) {
    assert.equal(true, ('number' === typeof value) && value > 0 && value < 24, message);
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
    assert.equal(true, ('number' === typeof inertiaDuration) && 0 <= inertiaDuration, 'inertia duration must be a positive number');
    assert.equal(true, (Array.isArray(activities)) && activities.length > 0, 'some activities must be defined');
    activities.forEach(function(activity) {
        assert.equal(true, activity instanceof Activity, 'activity should be instance of Activity');
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
    assertDayHour(hour, 'hour must be in [0, 24[');

    return this.activities.reduce(function(isOn, activity) {
        return isOn || activity.isOn(hour);
    }, false);
};

module.exports = {
    Activity: Activity,
    HeatSource: HeatSource
};
