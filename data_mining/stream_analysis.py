#!/usr/bin/python
# -*- coding: utf-8 -*-

"""
===========================================================
              Watts-app data mining module
===========================================================
This module:
- listens for datasets sent by the webapp module via zeromq
- performs a linear regression
- returns the model via zeromq
"""
print(__doc__)

import os
import zmq
from time import localtime, strftime
import json
from sklearn import linear_model
from scipy.sparse import lil_matrix

# basic logger
def log(text) :
    print(strftime("%H:%M:%S", localtime()) + ': ' + text)

# reduces the on & off heat sources into a unique list
def sampleSourcesReducer(heatSources, sample):
    for source in (sample['statusesOn'] + sample['statusesOff']):
        if source not in heatSources:
            heatSources.append(source)
    return heatSources

def fitRegressionModel(samples):
    # lists the data sample having a meanT
    temperatureSamples = [sample for sample in samples if sample['meanT'] != None]

    # exits if no temperature sample
    if len(temperatureSamples) < 1:
        return None

    uniqueHeatSources = []
    reduce(sampleSourcesReducer, temperatureSamples, uniqueHeatSources)
    uniqueHeatSources.sort()

    # exits if no heat source features
    if len(uniqueHeatSources) < 1:
        return None

    # sparse matrix of unique heat sources, one row per temperature data sample
    featuresMatrix = lil_matrix((len(temperatureSamples), len(uniqueHeatSources)))

    # fills the feature matrix and the temperature array for the linear regression
    meanTemperatures = []
    for index, sample in enumerate(temperatureSamples):
        # temperature
        meanTemperatures.append(sample['meanT'])

        # heat source features
        for onSource in sample['statusesOn']:
            featuresMatrix[index, uniqueHeatSources.index(onSource)] = 1
        for offSource in sample['statusesOff']:
            featuresMatrix[index, uniqueHeatSources.index(offSource)] = 0

    temperatureRidgeReg = linear_model.Ridge(alpha=0.4, copy_X=True, fit_intercept=True, normalize=False)
    temperatureRidgeReg.fit(featuresMatrix, meanTemperatures)

    responseModel = {
        'intercept': temperatureRidgeReg.intercept_,
        'score': temperatureRidgeReg.score(featuresMatrix, meanTemperatures),
        'coefficients': [{'source': source, 'coef': coef} for source, coef in zip(uniqueHeatSources, temperatureRidgeReg.coef_)]
    }

    return responseModel

context = zmq.Context()
receiver = context.socket(zmq.REP)
connectionPoint = 'tcp://' + os.getenv('SAMPLES_TCP_URL', '*:6969')
log('binding to ' + connectionPoint + '...')
receiver.bind(connectionPoint)
log('bound to ' + connectionPoint)

# awaits for data sample messages and processes them
try:
    while True:
        requestMessage = receiver.recv()
        # log('received request: ' + requestMessage)
        request = json.loads(requestMessage)
        regressionModel = fitRegressionModel(request['samples'])
        receiver.send(json.dumps({'requestId': request['requestId'], 'model': regressionModel}))
finally:
    receiver.close()
    context.term()
    log('closed socket and connection')
