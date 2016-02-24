var logger = require('./helpers/logger');
var log = require('./helpers/logger')(module);

var yargs = require('yargs');
var fs = require('fs');
var process = require('process');

try {


    var express = require('express');

    var app = express();

    var config = getConfig();
    checkConfig(config);
    logger.setConfing(config);

    log.debug("Setting config", config);
    app.appconfig = config;

    checkPid(config.pid);

    app.use(logger.expressLogger(module));

    log.debug("Starting server...");
    var server = app.listen(config.port, config.host, function (err) {
        "use strict";

        if (err != null) {
            log.error(err);
            process.exit(1);
        }

        var url = "http://" + server.address().address +":"+ (server.address().port || '');

        var data = "" + process.pid + "\n" +
            url + config.apiRoute;

        fs.writeFileSync(config.pid, data, 'utf8');

        wireExit(config.pid);

        log.info("Server start at http://%s:%s", server.address().address, server.address().port);
    });


    app.appsocket = require("socket.io")(server);

    app.use(function (req, res, next) {
        req.appconfig = config;
        next();
    });

    app.use(express.static(config.public));
    app.use(require("./controllers")(app));

    app.use(errorLog);
    app.use(errorHandler);


} catch (err) {

    if (err instanceof ConfigError) {
        yargs.showHelp();
    }
    log.error(err);

    process.exit(1);
}

function errorLog(err, req, res, next) {
    "use strict";
    log.error(err);
    next(err);
}

function errorHandler(err, req, res, next) {
    "use strict";
    res.status(500);
    res.end("Internal server error");
}


function ConfigError(message) {
    this.message = message;
}

function getConfig() {

    /**
     * Commandline args:
     *
     * ENV prefix SYNCJS_
     */
    var internalJSON = JSON;

    try {

        JSON = require('hjson');

        var args = yargs
        //Web server options
            .option('host', {
                alias: 'a',
                group: 'Webserver:',
                default: '127.0.0.1',
                nargs: 1,
                describe: "listen server address"

            })
            .option('port', {
                alias: 'p',
                group: 'Webserver:',
                default: 3000,
                nargs: 1,
                describe: "listen server port"

            })
            .option('apiRoute', {
                alias: 'apiRoute',
                group: 'Webserver:',
                default: '/api',
                nargs: 1,
                describe: "api route for service"
            })
            .option('www', {
                group: 'Webserver:',
                default: true,
                describe: "enable web interface (-no-www to disable www client)"
            })

            .option('origin', {
                alias: 'o',
                group: 'Rsync:',
                //demand: true,
                nargs: 1,
                describe: 'origin of files, loacl path'
            })

            .option('target', {
                alias: 't',
                group: 'Rsync:',
                //demand: true,
                nargs: 1,
                describe: 'target of files, can be remote path user@host:path'
            })
            //over options options
            .option('v', {
                alias: "verbose",
                description: 'set global log level to debug'
            })
            .option('role', {
                nargs: 1,
                description: 'role of the server way of copying files downloader or consumer'
            })
            .option('emulate', {
                nargs: 1,
                description: 'emulate connected flash drive path'
            })
            .env("SYNCJS_")
            .usage('Usage: $0 [options]')
            .config('c', "Config file")
            .alias('c', 'config')
            .default('c', './config.json')
            .help('h')
            .alias('h', 'help')
            .epilog('vfrc29@gmail.com, MIT license 2015')
            .argv;

        if (!args.public)
            args.public = './public';

        if (!args.mountPath)
            args.mountPath = '/media';

        if (!args.pid)
            args.pid = './.syncjspid';

        if (!args.rsyncCommand)
            args.rsyncCommand = 'rsync';

        if (!args.cacheFile)
            args.cacheFile = './.syncjscache';

        if (!args.cacheTimeout)
            args.cacheTimeout = 60*60*1000; //1h

        if (!args.hddCacheFile)
            args.hddCacheFile = '.syncjscache';

        if (!args.perDeviceSettings)
            args.perDeviceSettings = '.syncjssettings';

        if (args.verbose)
            logger.setGlobalLevel('debug');

        return args;
    }
    catch (err) {
        throw err;
    }
    finally {
        JSON = internalJSON;

    }
}

function checkConfig(args) {
    if (!args.origin || !args.target)
        throw new ConfigError("Rsync from and target paths are required");
}

function checkPid(pid) {

    if (fs.existsSync(pid)) {
        //throw new Error("Server already started");
    }
}

function rmPid(pid) {
    try {
        log.info("Remove pid " + pid);
        fs.unlinkSync(pid);
    } catch (err) {
        log.warn(err);
    }
}

function wireExit(pid) {
    function exitHandler(options, err) {

        if (options.cleanup) rmPid(pid);
        if (err) console.log(err.stack);
        if (options.exit) process.exit();
    }

//do something when app is closing
    process.on('exit', exitHandler.bind(null, {cleanup: true}));

//catches ctrl+c event
    process.on('SIGINT', exitHandler.bind(null, {exit: true}));

//catches uncaught exceptions
    process.on('uncaughtException', exitHandler.bind(null, {exit: true}));
}


