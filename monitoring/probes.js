'use strict';

// used to check business rules when constructing factories
var Rx = require('rx'),
    Factories = require('../factory/factories'),
    Factory = Factories.Factory,
    HeatSource = Factories.HeatSource;

function noise(value, deviationRange) {
    // defaults the range of the noise to 1: the noise will vary from -0.5 to 0.5
    deviationRange = deviationRange || 1;
    console.log('noising value ' + value);
    return value + deviationRange*(0.5 - Math.random());
}

/**
 * This module models a set of probes plugged in the factory which randomly monitor:
 * - the global temperature of the factory
 * - the on/off status of each heat source
 *
 * @param factory the factory being monitored
 * @return the probes described by the monitored items and the events channel of monitoring data
 */
module.exports = function(factory) {
    var monitoredItems = [factory];
    factory.heatSources.forEach(function(factoryHeatSource) {
        monitoredItems.push(factoryHeatSource.heatSource);
    });

    // timer triggering sample events (500ms before producing 1st value and between values)
    var probeEvents = Rx.Observable.timer(500, 1000)
        // randomly selects a monitored item
        .map(function() {
            return monitoredItems[Math.floor(monitoredItems.length * Math.random())];
        })
        // monitors it
        .map(function(monitoredItem) {
            // initializes the probe data with a random hour in the day
            var probeData = { hour: 24*Math.random() };

            // monitors the factory temperature
            if (monitoredItem instanceof Factory) {
                console.log('sampling temperature at ' + probeData.hour);
                probeData.temperature = noise(factory.getTemperature(probeData.hour));
            }
            else if (monitoredItem instanceof HeatSource) {
                probeData.heatSource = monitoredItem.name;
                probeData.status = monitoredItem.isOn(probeData.hour) ? 'on' : 'off';
                console.log('sampling ' + probeData.heatSource + ' status at ' + probeData.hour);
            }

            return probeData;
        });

    return {
        events: probeEvents,
        monitoredItems: monitoredItems
    };
};
