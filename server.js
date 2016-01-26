// creates the ExpressJS web server for the Wahls protocol with websocket support
var express = require('express'),
    wattsApp = express(),
    http = require('http').Server(wattsApp),
    io = require('socket.io')(http),
    httpPort = process.env.PORT || 3030;

// serves the webapp
wattsApp.use(express.static('webapp'));
wattsApp.use(express.static('node_modules/function-plot/dist'));

// starts the web aplication server on the configured HTTP port
http.listen(httpPort, function() {
    console.log('listening on *:' + httpPort + '\nctrl+c to stop the app');
});

// handles a websocket connection
io.sockets.on('connection', require('./api/socket')(
    require('./factory/factories'),
    require('./monitoring/probes'),
    require('./monitoring/map-reducers')));

// shuts the application down on low-level errors
function shutdown() {
    console.log('WattsApp is shutting down...');
    process.exit(1);
};
process.on('SIGINT', shutdown).on('SIGTERM', shutdown);
