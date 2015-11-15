'use strict';

angular.module('SocketAPI', [])
    .service('socketAPI', ['$rootScope', '$q', function ($rootScope, $q) {
        // holds the promise of a connected socket
        var deferredConnectedSocket = $q.defer();
        function onConnectedSocket() {
            return deferredConnectedSocket.promise;
        }

        // connects with the server and resolves the promise
        var _socket = io.connect();
        _socket.on('connect', function () {
            deferredConnectedSocket.resolve(_socket);
        });

        /** emits an event to the server with a facultative callback */
        function emit(eventName, data, callback) {
            onConnectedSocket().then(function(socket) {
                socket.emit(eventName, data, function () {
                    if (callback) {
                        var args = arguments;
                        $rootScope.$apply(function () {
                            callback.apply(socket, args);
                        });
                    }
                });
            });
        }

        // the socketAPI service
        var socketAPI = {
            /** listens for a server event */
            on: function (eventName, callback) {
                onConnectedSocket().then(function(socket) {
                    socket.on(eventName, function () {
                        var args = arguments;
                        $rootScope.$apply(function () {
                            callback.apply(socket, args);
                        });
                    });
                });
            },

            emit: emit,

            /** emits an event to the server and resolves its callback data in a promise */
            qemit: function (eventName, data) {
                var deferredData = $q.defer();
                onConnectedSocket().then(function(socket) {
                    socket.emit(eventName, data, function (responseData) {
                        deferredData.resolve(responseData);
                    });
                });

                return deferredData.promise;
            }
        };

        return socketAPI;
    }]);
