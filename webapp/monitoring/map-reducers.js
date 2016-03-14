'use strict';

var assert = require('../test/assert-utils'),
    Rx = require('rx'),
    RSVP = require('rsvp'),
    zmq = require('zmq'),
    requester = zmq.socket('req'),
    tcpUrl = 'localhost:6969',
    // sets the default or the process.env-defined TCP connection URL
    connectionPoint = 'tcp://' + (process.env.SAMPLES_TCP_URL || tcpUrl),
    deferredModelsByRequestId = {},
    requestId = 1,
    computingModel = false;

// connects to the data-mining service
console.log('binding to the data mining service at ' + connectionPoint);
requester.connect(connectionPoint);

// provides unique request ids to the data-mining service
function nextRequestId() {
    return requestId++;
}

/**
 * Sends a request to the data-mining service (with a unique request id) to compute
 * a linear regression model.
 * Returns a promise of the model, cached by the request id. The requester.on callback
 * resolves the cached promise with request id included in the response.
 *
 * @param lapseSamplesByTimeSlots the data required by the data-mining service
 * @return a promise of the model
 */
function computeModelPromise(lapseSamplesByTimeSlots) {
    // initializes the deferred promise to return
    var deferredModel = RSVP.defer();

    // builds the request to send the data-mining service
    var requestId = nextRequestId(),
        requestData = {
            requestId: requestId,
            samples: Object.keys(lapseSamplesByTimeSlots).map(function(property) {
                return lapseSamplesByTimeSlots[property];
            })
        };
    // flags the deferred promise so that it can be resolved on requester's response
    deferredModelsByRequestId[requestId] = deferredModel;

    // sends the request to the data-mining service
    requester.send(JSON.stringify(requestData));

    return deferredModel.promise;
}

// retrieves the model responses from the data-mining microservice
requester.on('message', function(responseMessage) {
    var response = JSON.parse(responseMessage),
        deferredModel = deferredModelsByRequestId[response.requestId];

    // applies the callback and removes it from the cache
    if (null !== deferredModel) {
        deferredModel.resolve(response.model);
        delete deferredModelsByRequestId[response.requestId];
    }

    // flags the data-mining cluster ready to compute another model
    computingModel = false;
});

/**
 * Models a time lapse of an hour during which data is aggregated
 *
 * @param hour an hour of the day in [0, 23]
 * @param meanT the mean factory temperature averaged during the hour
 * @param meanSquares sum of the temperatures squares
 * @param nbSamples the number of samples involved in the squares sum
 * @param statusesOn the heat sources that are on during this time lapse
 * @param statusesOff the heat sources that are off during this time lapse
 */
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

/**
 * Listens for events from the probes and populates 2 publishers:
 * - the data samples publisher which produces the last update LapseSample
 * - the model publisher which produces a linear regression model to assess the impact of heat sources on the factory temperature
 *
 * @param probesEventsChannel
 * @return the producers
 */
function probesEventProducers(probesEventsChannel) {
    // caches the lapse samples by their timeslot
    var lapseSamplesByTimeSlots = {};

    var lapseSamplesChannel = probesEventsChannel
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

    // computes a temperature regression model after each new lapseSample
    var modelsChannel = lapseSamplesChannel.flatMap(function(lapseSample) {
        // skips computing model if a computation is already running
        if (computingModel) {
            var promise = new RSVP.Promise(function(resolve, reject) {
                resolve(null);
            });
            return Rx.Observable.fromPromise(promise);
        }
        else {
            computingModel = true;
            return Rx.Observable.fromPromise(computeModelPromise(lapseSamplesByTimeSlots));
        }
    });

    // returns the lapse sample and model producers, along with the timelapses
    return {
        getTimeLapses: function() {
            return lapseSamplesByTimeSlots;
        },
        lapseSamplesProducer: lapseSamplesChannel,
        modelsProducer: modelsChannel
    }
}

module.exports = {
    LapseSample: LapseSample,
    probesEventProducers: probesEventProducers
}
