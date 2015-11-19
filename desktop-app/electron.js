var app = require('app');
var BrowserWindow = require('browser-window');

app.commandLine.appendSwitch('--ignore-gpu-blacklist');

app.on('window-all-closed', function () {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

var mainWindow = null;
app.on('ready', function () {

    mainWindow = new BrowserWindow({
        'node-integration': false,
        'auto-hide-menu-bar': true
    });

    mainWindow.loadURL('http://localhost:3030/');

    //mainWindow.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
});
