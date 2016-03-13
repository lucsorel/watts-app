'use strict';

var assert = require('assert');

// adds an assertion utility for thrown errors
assert.throwMessage = function(test, message, logErrorMessage) {
    assert.throws(test, function(error) {
        if (true === logErrorMessage) {
            console.log(error.toString());
        }

        assert.equal(true, error.toString().indexOf(message) > -1, 'error message must contain ' + message);
        return true;
    });
}

/**
 * Asserts that the value is a number between 0 and 24
 *
 * @param value
 * @param message
 */
assert.dayHour = function(value, message) {
    // default error message
    message = message || 'hour must be in [0, 24[';
    assert.equal(true, ('number' === typeof value) && value >= 0 && value < 24, message);
}

module.exports = assert;
