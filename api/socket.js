'use strict';

module.exports = function(Factories, Probes) {
    // business models
    var HeatSource = Factories.HeatSource,
        Activity = Factories.Activity,
        Factory = Factories.Factory;

    // builds a demo factory
    var morningActivity = new Activity(9, 13),
        afternoonActivity = new Activity(15, 15.5),
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
    factory.addHeatSource(furnace, furnaceWeight).addHeatSource(press, pressWeight);

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
        socket.on('factory.get', function(params, dataCallback) {
            dataCallback(factory);
        });

        var lapseSamples = [];
        var probes = Probes(factory);
        var probesSubscription = null;
        socket.on('sampling.start', function() {
            if (null === probesSubscription) {
                probesSubscription = probes.events.subscribe(
                    function (x) {
                        console.log(x);
                    },
                    function (err) {
                        console.log('Monitoring error: ' + err);
                    },
                    function () {
                        console.log('Monitoring completed');
                    });
            }
        });

        // stops monitoring
        socket.on('sampling.stop', function() {
            if (null !== probesSubscription) {
                probesSubscription.dispose();
                probesSubscription = null;
            }
        });
    }
};
