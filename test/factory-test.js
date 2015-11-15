'use strict';

var assert = require('./assert-utils.js'),
    // business models
    HeatSources = require('../factory/heat-sources.js'),
    HeatSource = HeatSources.HeatSource,
    Activity = HeatSources.Activity,

    Factories = require('../factory/factory.js'),
    Factory = Factories.Factory,
    FactoryHeatSource = Factories.FactoryHeatSource;

describe('Factory', function() {
    describe('# construction', function() {
        it('should construct a factory', function() {
            var factory = new Factory('Ker Escuelle', 13);
            assert.equal('Ker Escuelle', factory.name, 'the name must be set');
            assert.equal(13, factory.idleTemperature, 'the idle temperature must be set');
        });

        it('should fail to construct a factory with an invalid name', function() {
            assert.throwMessage(function() {
                new Factory(undefined, 13);
            }, 'a name must be defined');
            assert.throwMessage(function() {
                new Factory(null, 13);
            }, 'a name must be defined');
            assert.throwMessage(function() {
                new Factory(0, 13);
            }, 'a name must be defined');
            assert.throwMessage(function() {
                new Factory('', 13);
            }, 'a name must be defined');
        });

        it('should fail to construct a factory with an invalid idle temperature', function() {
            assert.throwMessage(function() {
                new Factory('Ker Escuelle', undefined);
            }, 'the idle temperature must be a number');
            assert.throwMessage(function() {
                new Factory('Ker Escuelle', null);
            }, 'the idle temperature must be a number');
            assert.throwMessage(function() {
                new Factory('Ker Escuelle', '13');
            }, 'the idle temperature must be a number');

        });
    });

    describe('# addHeatSource()', function() {
        it('should add well-defined heat sources', function() {
            var morningActivity = new Activity(9, 11),
                afternoonActivity = new Activity(14, 16),
                furnace = new HeatSource('furnace', 12, 1, [morningActivity, afternoonActivity]);

            var noonActivity = new Activity(12, 15),
                press = new HeatSource('press', 7, 0.5, [noonActivity]);

            // adds the heat sources with API-fluent style
            var factory = new Factory('Ker Escuelle', 13);
            factory.addHeatSource(furnace, 0.5).addHeatSource(press, 0.25);

            assert.equal(2, factory.heatSources.length, 'there must be 2 sources');
            var source1 = factory.heatSources[0],
                source2 = factory.heatSources[1];
            assert.equal(true, source1 instanceof FactoryHeatSource, 'source 1 must be wrapped as FactoryHeatSource');
            assert.equal(0.5, source1.weight, 'check source 1 weight');
            assert.equal('furnace', source1.heatSource.name, 'check source 1 name');
            assert.equal(2, source1.heatSource.activities.length, 'check source 1 activities');

            assert.equal(true, source2 instanceof FactoryHeatSource, 'source 2 must be wrapped as FactoryHeatSource');
            assert.equal(0.25, source2.weight, 'check source 2 weight');
            assert.equal('press', source2.heatSource.name, 'check source 2 name');
            assert.equal(1, source2.heatSource.activities.length, 'check source 2 activities');
        });

        it('should reject invalid weights', function() {
            var morningActivity = new Activity(9, 11),
                afternoonActivity = new Activity(14, 16),
                furnace = new HeatSource('furnace', 12, 1, [morningActivity, afternoonActivity]);

            var factory = new Factory('Ker Escuelle', 13);

            assert.throwMessage(function() {
                factory.addHeatSource(furnace, undefined);
            }, 'weight must be a positive number in [0, 1]');
            assert.throwMessage(function() {
                factory.addHeatSource(furnace, null);
            }, 'weight must be a positive number in [0, 1]');
            assert.throwMessage(function() {
                factory.addHeatSource(furnace, '0');
            }, 'weight must be a positive number in [0, 1]');
            assert.throwMessage(function() {
                factory.addHeatSource(furnace, -0.1);
            }, 'weight must be a positive number in [0, 1]');
            assert.throwMessage(function() {
                factory.addHeatSource(furnace, 1.1);
            }, 'weight must be a positive number in [0, 1]');
        });

        it('should reject invalid heat sources', function() {
            var factory = new Factory('Ker Escuelle', 13);

            assert.throwMessage(function() {
                factory.addHeatSource(undefined, 0.5);
            }, 'heat source should be an instance of HeatSource');
            assert.throwMessage(function() {
                factory.addHeatSource(null, 0.5);
            }, 'heat source should be an instance of HeatSource');
            assert.throwMessage(function() {
                factory.addHeatSource('furnace', 0.5);
            }, 'heat source should be an instance of HeatSource');
            assert.throwMessage(function() {
                factory.addHeatSource({
                    name: 'furnace',
                    temperature: 17,
                    inertiaDuration: 2,
                    activities: [{startHour: 10, endHour: 12}]
                }, 0.5);
            }, 'heat source should be an instance of HeatSource');
        });
    });

    describe('# getTemperature()', function() {
        it('should account for the idle temperature and the contributions of all the source activities', function() {
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

            assert.equal(idleHeat, factory.getTemperature(8), 'idle temperature when no activity is on');

            // furnace morning activity starts
            assert.equal(idleHeat, factory.getTemperature(9), 'idle temperature when morning starts up');
            assert.equal(idleHeat + (furnaceWeight * furnaceHeat * ( Math.min(9.5 - 9, furnaceInertia) / furnaceInertia)),
                factory.getTemperature(9.5), 'partial furnace morning contribution');
            assert.equal(13 + (8 * 0.5 * ((1 * 0.5) / 1)),
                factory.getTemperature(9.5), 'partial furnace morning contribution (figures)');
            assert.equal(17,
                factory.getTemperature(10), 'full furnace morning contribution');
            assert.equal(17,
                factory.getTemperature(11), 'full furnace morning contribution');
            assert.equal(17,
                factory.getTemperature(12), 'full furnace morning contribution at press noon start-up');

            // press noon activity starts
            assert.equal(17 + (pressWeight * pressHeat * ( Math.min(12.25 - 12, pressInertia) / pressInertia)),
                factory.getTemperature(12.25), 'partial press noon contribution');
            assert.equal(17 + 1.25 /* 2.5 * (0.25/0.5) */,
                factory.getTemperature(12.25), 'partial press noon contribution (figures)');
            assert.equal(13 + 4 + 2.5,
                factory.getTemperature(12.5), 'full furnace morning and press noon contributions');
            assert.equal(13 + 4 + 2.5,
                factory.getTemperature(13), 'full furnace morning and press noon contributions');
            assert.equal(13 + (4*0.5) + 2.5,
                factory.getTemperature(13.5), 'full press noon and decaying furnace morning contributions');

            // furnace morning stops, press noon activity
            assert.equal(13 + (4*0) + 2.5,
                factory.getTemperature(14), 'full press noon and decayed furnace morning contributions');

            // furnace afternoon starts
            assert.equal(13 + 2.5 + (4*0),
                factory.getTemperature(15), 'full press noon contribution at afternoon furnace start-up');
            assert.equal(13 + 2.5*(0.25/0.5) + 4*(0.25),
                factory.getTemperature(15.25), 'decaying press noon and rising afternoon press contributions');

            // press noon stops
            assert.equal(13 + 2.5*(0) + 4*(0.5),
                factory.getTemperature(15.5), 'decayed press noon and half afternoon press contributions');
            assert.equal(13 + (4*0.5*0.5),
                factory.getTemperature(15.75), 'partial afternoon press decay contribution');
            assert.equal(13 + 4*0,
                factory.getTemperature(16), 'fully-decayed afternoon press contribution');

            assert.equal(idleHeat, factory.getTemperature(16.5), 'idle temperature after all activities have decayed');
            assert.equal(idleHeat, factory.getTemperature(18), 'idle temperature after all activities have decayed');
        });
    });
});
