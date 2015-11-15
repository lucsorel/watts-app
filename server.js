// creates the ExpressJS web server for the Wahls protocol with websocket support
var express = require('express'),
    wattsApp = express(),
    http = require('http').Server(wattsApp),
    io = require('socket.io')(http);

// serves the webapp
wattsApp.use(express.static('webapp'));

// confirmation message until a true html landing page is necessary
wattsApp.get('/', function(request, response) {
  response.send('The web server for the Wahls protocol companion is up!');
});

// starts the web aplication server on the configured HTTP port
http.listen(3030, function() {
    console.log('listening on *:' + 3030 + '\nctrl+c to stop the app');
});

// handles a websocket connection
io.sockets.on('connection', require('./api/socket')(require('./factory/factories')));

// shuts the application down on low-level errors
function shutdown() {
    console.log('WattsApp is shutting down...');
    process.exit(1);
};
process.on('SIGINT', shutdown).on('SIGTERM', shutdown);
