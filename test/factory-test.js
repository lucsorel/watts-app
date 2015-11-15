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
});
