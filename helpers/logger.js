/**
 * Created by vfrc2 on 08.12.15.
 */

var winston = require('winston');

//requests.log - log all web requsts
var reqFileTransport = new (winston.transports.File)({
    filename: 'requests.log',
    json: false,
    level: 'info'
});

//execution.log - log all except requests
var logFileTransport = new (winston.transports.File)({
    filename: 'log.log',
    json: false,
    level: 'info'
});

var consoleTransport = new (winston.transports.Console)({
    level: 'info'
});

var container = new winston.Container();

function createLogger(module) {
    var logger = container.add(module, {
        transports: [consoleTransport, logFileTransport],
    });

    logger.filters.push(function(lvl, msg, meta){
        return "["+module+"] " + msg;
    });

    return logger;

}

function createRequestLoger(module) {
    var logger = container.add(module, {
        transports: [reqFileTransport, consoleTransport]
    });

    logger.filters.push(function(lvl, msg, meta){
        return "["+module+"] " + msg;
    });

    return logger;
}

createLogger.request = createRequestLoger;
createLogger.setConsoleVerbose = function(level){
    consoleTransport.level = level;
};
module.exports = createLogger;