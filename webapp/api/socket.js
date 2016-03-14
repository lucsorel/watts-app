'use strict';

module.exports = function(Factories, Probes, Reducers) {
    // business models
    var HeatSource = Factories.HeatSource,
        Activity = Factories.Activity,
        Factory = Factories.Factory;

    // builds a demo factory
    var startActivity = new Activity(5, 9),
        endActivity = new Activity(16, 19),
        heaterHeat = 5,
        heaterInertia = 1.5,
        heaterWeight = 0.4,
        heater = new HeatSource('heater', heaterHeat, heaterInertia, [startActivity, endActivity]);

    var morningActivity = new Activity(9, 13),
        afternoonActivity = new Activity(15, 16),
        furnaceHeat = 8,
        furnaceInertia = 1,
        furnaceWeight = 0.5,
        furnace = new HeatSource('furnace', furnaceHeat, furnaceInertia, [morningActivity, afternoonActivity]);

    var noonActivity = new Activity(12, 15),
        pressHeat = 10,
        pressInertia = 0.5,
        pressWeight = 0.25,
        press = new HeatSource('press', pressHeat, pressInertia, [noonActivity]);

    // adds the heat sources with API-fluent style
    var idleHeat = 13,
        factory = new Factory('Ker Escuelle', idleHeat);
    factory.addHeatSource(heater, heaterWeight).addHeatSource(furnace, furnaceWeight).addHeatSource(press, pressWeight);

    // adds the formula as a property of the factory
    factory.formula = 'f(t) = ' + factory.getTemperatureFormula();

    /**
     * Handles the connected websocket
     *
     * @param socket
     *
     * @return connected socket handler
     */
    return function(socket) {
        socket.on('factoryGet', function(params, dataCallback) {
            dataCallback(factory);
        });

        var factoryProbesEventProducers = Reducers.probesEventProducers(Probes(factory).events),
            lapseSamplesProducer = factoryProbesEventProducers.lapseSamplesProducer,
            modelsProducer = factoryProbesEventProducers.modelsProducer,
            laspeSamplesSubscription = null,
            modelsSubscription = null;

        // bulk-returns the lapse samples
        socket.on('lapseSamples', function(params, dataCallback) {
            dataCallback(factoryProbesEventProducers.getTimeLapses());
        })

        // starts monitoring: subscribes to the event producers
        socket.on('samplingStart', function() {
            if (null === laspeSamplesSubscription) {
                // emits incoming laps samples
                laspeSamplesSubscription = lapseSamplesProducer.subscribe(
                    function (lapseSample) {
                        // emits the updated lapse sample to the client
                        if (null !== lapseSample) {
                            socket.emit('lapseSampleUpdate', lapseSample);
                        }
                    },
                    function (err) {
                        console.log('Monitoring error: ' + err);
                    },
                    function () {
                        console.log('Monitoring completed');
                    });
            }
            if (null === modelsSubscription) {
                // emits incoming laps samples
                modelsSubscription = modelsProducer.subscribe(
                    function (model) {
                        // emits the updated model to the client
                        if (null !== model) {
                            socket.emit('modelUpdate', model);
                        }
                    },
                    function (err) {
                        console.log('Monitoring error: ' + err);
                    },
                    function () {
                        console.log('Monitoring completed');
                    });
            }
        });
        // stops the subscriptions to the lapseSamples and models producers
        function disposeSubscriptions() {
            if (null !== laspeSamplesSubscription) {
                laspeSamplesSubscription.dispose();
                laspeSamplesSubscription = null;
            }
            if (null !== modelsSubscription) {
                modelsSubscription.dispose();
                modelsSubscription = null;
            }
        }

        // stops monitoring on websocket disconnection or stop sampling
        socket.on('disconnect', disposeSubscriptions);
        socket.on('samplingStop', disposeSubscriptions);
    }
};
