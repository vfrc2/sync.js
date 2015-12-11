/**
 * Created by vfrc2 on 08.12.15.
 */

var log4js = require('log4js');
var path = require('path');

var basepath = path.dirname(__dirname);

log4js.setGlobalLogLevel("info");

function createLogger(tag) {

    var name = path.relative(basepath,
        path.basename(module.parent.filename, ".js"))
        .split('/').join('.');
    if (tag)
        name += "." + tag;

    var logger = log4js.getLogger(name);

    var baseDebug = logger.debug;
    logger.debug = function (message) {
        if (logger.isLevelEnabled("debug"))
            baseDebug.apply(logger, arguments);
    };

    return logger;

}

createLogger.setConfing = function (config) {

    log4js.configure(config);

    if (config.appenders &&
        config.appenders.filter(
            function (app) {
                if (app.type && app.type === "console")
                    return app;
            }).length < 1)
            log4js.addAppender(log4js.appenders.console());



};


createLogger.setGlobalLevel = function (level) {
    log4js.setGlobalLogLevel(level);
}


module.exports = createLogger;