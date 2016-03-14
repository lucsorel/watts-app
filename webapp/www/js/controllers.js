// navigation controller
angular.module('WattsApp')
    .controller('NavigationController', ['factory', 'navigationService', function(factory, navigationService) {
        var ctrl = this;
        ctrl.factory = factory;
        ctrl.page = navigationService.page;
    }])
    // factory details controller
    .controller('FactoryController', ['$scope', 'factory', 'socketService', function($scope, factory, socketService) {
        var ctrl = this;
        ctrl.factory = factory;

        // the raw temperature evolution formula issued by the monitoring
        var monitoringRawFormula = 'f(t) = 0';

        // settings for the temperature plots
        var plotSettings = {
            target: '#factoryTemperaturePlot',
            disableZoom: true,
            xDomain: [0, 24],
            yDomain: [10, 22],
            data: [{
                    range: [0, 24],
                    fn: math.eval(factory.formula)
                }]
        };
        var monitoredData = {
            range: [0, 24],
            fn: math.eval(monitoringRawFormula)
        };
        plotSettings.data.push(monitoredData);

        // draws the "real" and monitored factory temperature plot
        ctrl.drawTemperaturePlot = function() {
            try {
                functionPlot(plotSettings);
            }
            catch (err) {
                console.log(err);
            }
        }

        // initial rendering of the factory temperature plot
        ctrl.drawTemperaturePlot(monitoringRawFormula);

        // flags the properties of the lapse samples to display them column-wise
        ctrl.lapseSampleKeys = ['timeslot', 'meanT', 'stdD', 'nbSamples'];
        factory.heatSources.forEach(function(factoryHeatSource) {
            ctrl.lapseSampleKeys.push(factoryHeatSource.heatSource.name);
        });

        // flags the map-reduced samples
        ctrl.lapseSamples = [];
        ctrl.onSampleUpdate = function(updatedLapseSample) {
            // transforms the lapse sample
            updatedLapseSample.stdD = Math.sqrt(updatedLapseSample.meanSquares - Math.pow(updatedLapseSample.meanT, 2));
            delete updatedLapseSample.meanSquares;
            updatedLapseSample.statusesOn.forEach(function(device) {
                updatedLapseSample[device] = true;
            });
            updatedLapseSample.statusesOff.forEach(function(device) {
                updatedLapseSample[device] = false;
            });

            // adds or replace the lapse sample
            var index = ctrl.lapseSamples.reduce(function(indexToUpdate, lapseSample, index) {
                return (lapseSample.id === updatedLapseSample.id) ? index : indexToUpdate;
            }, -1);
            if (-1 === index) {
                ctrl.lapseSamples.push(updatedLapseSample);
            }
            else {
                ctrl.lapseSamples[index] = updatedLapseSample;
            }

            // updates the temperature plot
            monitoredData.fn = math.eval(ctrl.lapseSamples.reduce(function(formula, lapseSamples) {
                if (!isNaN(lapseSamples.meanT) && lapseSamples.meanT > 0) {
                    formula += ' + (('+lapseSamples.id+' <= t and t < '
                        +(lapseSamples.id + 1) + ') ? ' + lapseSamples.meanT + ' : 0)';
                }

                return formula;
            }, monitoringRawFormula));
            ctrl.drawTemperaturePlot();
        };

        ctrl.onModelUpdate = function(updatedModel) {
            // updates the contributions of the factory heat sources
            ctrl.factory.heatSources.forEach(function(heatSource) {
                var sourceCoefficient = updatedModel.coefficients.find(function(coefficient) {
                    return coefficient.source === heatSource.heatSource.name;
                });
                if (sourceCoefficient) {
                    heatSource.contribution = sourceCoefficient.coef;
                }
            });

            ctrl.factory.meanT = updatedModel.intercept;
            ctrl.factory.confidence = updatedModel.score;
        };

        // updates the data when receiving updated samples
        socketService.on('lapseSampleUpdate', ctrl.onSampleUpdate, $scope);
        socketService.on('modelUpdate', ctrl.onModelUpdate, $scope);

        ctrl.isSampling = false;
        ctrl.switchSampling = function() {
            ctrl.isSampling = !ctrl.isSampling;

            socketService.emit(ctrl.isSampling ? 'samplingStart' : 'samplingStop');
        }

        // retrieves the existing lapse samples to initialize the monitoring table
        socketService.qemit('lapseSamples').then(function(lapseSamplesResponse) {
            Object.keys(lapseSamplesResponse).forEach(function(lapseSampleKey) {
                ctrl.onSampleUpdate(lapseSamplesResponse[lapseSampleKey]);
            })
        });

        // cleanup when leaving the connector: stops monitoring, removes the socket handler
        $scope.$on('$destroy', function() {
            if (ctrl.isSampling) {
                ctrl.switchSampling();
            }
        });
    }])
    ;
