'use strict';

var assert = require('../test/assert-utils');

function LapseSample(hour, meanT, meanSquares, nbSamples, statusesOn, statusesOff) {
    assert.dayHour(hour);
    this.id = Math.floor(hour);
    this.timeslot = this.id + '-' + (this.id + 1) + 'h';

    this.meanT = meanT;
    this.meanSquares = meanSquares || 0;
    this.nbSamples = nbSamples || 0;
    this.statusesOn = statusesOn || [];
    this.statusesOff = statusesOff || [];
}

function probeEventsReducer(probesEventsChannel) {
    // caches the lapse samples by their timeslot
    var lapseSamplesByTimeSlots = {};

    var updatedTimeLapses = probesEventsChannel
        // converts the probe data into a unit lapse sample
        .map(function(probeData) {
            // status monitoring
            if (probeData.heatSource) {
                var statusesOn = probeData.isOn ? [probeData.heatSource] : null;
                var statusesOff = probeData.isOn ? null : [probeData.heatSource];
                return new LapseSample(
                    probeData.hour,
                    // no mean, squares nor sample numbers
                    null, null, null,
                    // statuses
                    statusesOn,statusesOff

                );
            }
            // temperature monitoring
            else {
                return new LapseSample(
                    probeData.hour,
                    probeData.temperature,
                    // single square variance for 1 sample value
                    Math.pow(probeData.temperature, 2), 1);
            }
        })
        // reduces the lapse sample with the current state and returns the updated one
        .map(function(lapseSample) {
            // first sample for this timeslot
            var currentLapseSample = lapseSamplesByTimeSlots[lapseSample.timeslot];
            if (undefined === currentLapseSample) {
                currentLapseSample = lapseSample;
            }
            // updates the lapse sample
            else {
                // updates the temperature-related values only if necessary
                if (lapseSample.nbSamples > 0) {
                    if (0 === currentLapseSample.nbSamples) {
                        currentLapseSample.meanT = lapseSample.meanT;
                        currentLapseSample.meanSquares = lapseSample.meanSquares;
                        currentLapseSample.nbSamples = lapseSample.nbSamples;
                    }
                    else {
                        // https://fr.wikipedia.org/wiki/Variance_%28statistiques_et_probabilit%C3%A9s%29#S.C3.A9rie_statistique
                        var totalSamples = lapseSample.nbSamples + currentLapseSample.nbSamples,
                            meansSquareDiff = Math.pow(lapseSample.meanT-currentLapseSample.meanT, 2);
                        currentLapseSample.meanT = ((lapseSample.nbSamples*lapseSample.meanT) + (currentLapseSample.nbSamples*currentLapseSample.meanT)) / totalSamples;
                        currentLapseSample.meanSquares = (currentLapseSample.meanSquares*currentLapseSample.nbSamples + lapseSample.meanSquares*lapseSample.nbSamples) / totalSamples;
                        currentLapseSample.nbSamples = totalSamples;
                    }
                }

                // aggregates the on and off statuses
                lapseSample.statusesOn.forEach(function(status) {
                    if (currentLapseSample.statusesOn.indexOf(status) < 0) {
                        currentLapseSample.statusesOn.push(status);
                    }
                });
                lapseSample.statusesOff.forEach(function(status) {
                    if (currentLapseSample.statusesOff.indexOf(status) < 0) {
                        currentLapseSample.statusesOff.push(status);
                    }
                });
            }

            // updates the lapse sample in the cache
            lapseSamplesByTimeSlots[lapseSample.timeslot] = currentLapseSample;
            return currentLapseSample;
        });

        return updatedTimeLapses;
}

module.exports = {
    LapseSample: LapseSample,
    probeEventsReducer:probeEventsReducer
}
