'use strict';

// used to check business rules when constructing factories
var assert = require('../test/assert-utils.js'),
    // heat sources dependencies
    HeatSources = require('./heat-sources.js'),
    HeatSource = HeatSources.HeatSource,
    Activity = HeatSources.Activity;

/**
 * Models a heat source contributing to the temperature of the factory
 *
 * @param heatSource the device (oven, press, heating system, etc.) contributing to the temperature of the factory
 * @param weight the influence factor of the heat source to the factory temperature
 */
function FactoryHeatSource(heatSource, weight) {
    // business rules
    assert.equal(true, ('number' === typeof weight) && 0 <= weight && weight <= 1, 'weight must be a positive number in [0, 1]');
    assert.equal(true, heatSource instanceof HeatSource, 'heat source should be an instance of HeatSource');

    this.heatSource = heatSource;
    this.weight = weight;
}

/**
 * Models a factory
 *
 * @param name the name of the factory
 * @param idleTemperature the temperature when no heat source is working in the factory (thus: idle)
 */
function Factory(name, idleTemperature) {
    // business rules
    assert.equal(true, ('string' === typeof name) && name.length > 0, 'a name must be defined');
    assert.equal(true, ('number' === typeof idleTemperature), 'the idle temperature must be a number');

    this.name = name;
    this.idleTemperature = idleTemperature;
    this.heatSources = [];
}

/**
 * Adds the given heat source with its relative influence factor on the factory temperature
 *
 * @param
 * @return factory for fluent-API addition of heat sources
 */
Factory.prototype.addHeatSource = function(heatSource, weight) {
    this.heatSources.push(new FactoryHeatSource(heatSource, weight));
    return this;
};

/**
 * Computes the factory temperature at the given moment by summing the heat
 * contributions of all its heat sources activities
 *
 * @param hour an hour of the day as a numeric value in [0, 24[
 * @return the temperature at the given moment
 */
Factory.prototype.getTemperature = function(hour) {
    // business rules
    assert.dayHour(hour);

    // sums the idle temperature with the heat source contributions at the given moment
    return this.heatSources.reduce(function(temperature, factoryHeatSource) {
        return temperature + (factoryHeatSource.weight * factoryHeatSource.heatSource.heatContribution(hour));
    }, this.idleTemperature);
};

/**
 * Produces the formula for the factory temperature evolution
 *
 * @return a textual formula where t is the hour of the day in [0, 24[
 */
Factory.prototype.getTemperatureFormula = function() {
    var formulaElements = [this.idleTemperature];

    this.heatSources.forEach(function(factoryHeatSource) {
        formulaElements.push('(' + factoryHeatSource.weight + '*' + factoryHeatSource.heatSource.heatContributionFormula() + ')');
    });

    return formulaElements.join(' + ')
}

module.exports = {
    Factory: Factory,
    FactoryHeatSource: FactoryHeatSource
};
