var logger = require('./helpers/logger');
var log = require('./helpers/logger')(module);

var yargs =  require('yargs');

try {

    var express = require('express');

    var app = express();

    var config = getConfig();
    checkConfig(config);
    logger.setConfing(config);

    log.debug("Setting config", config);
    app.appconfig = config;

    log.debug("Starting server...");
    var server = app.listen(config.webserver.port, function (err) {
        "use strict";

        if (err != null) {
            log.error(err);
            process.exit(1);
        }

        log.info("Server start at http://%s:%s", server.address().address, server.address().port);
    });

    app.appsocket = require("socket.io")(server);

    app.use(function(req, res, next){
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
};

function errorHandler(err, req, res, next) {
    "use strict";
    res.status(500);
    res.end("Internal server error");
};


function ConfigError(message) {
    this.message = message;
}

function getConfig() {

    /**
     * Comandline args:
     *
     * ENV prefix SYNCJS_
     */
    var internalJSON = JSON;

    try {

        JSON = require('hjson');

        var args = yargs
        //Web server options
            .option('webserver.port', {
                alias: ['p', 'port'],
                group: 'Webserver:',
                default: 3000,
                nargs: 1,
                describe: "listen server port",

            })
            .option('webserver.apiroute', {
                alias: 'apiroute',
                group: 'Webserver:',
                default: '/api',
                nargs: 1,
                describe: "api route for service"
            })
            .option('webserver.www', {
                group: 'Webserver:',
                default: true,
                describe: "enable web interface (-no-www to disable www client)"
            })

            //Rsync options
            .option('rsync.ignorefile', {
                alias: 'ignorefile',
                group: 'Rsync:',
                default: '.syncIgnore',
                nars: 1,
                description: "name for ignore file placed on ext hdd"
            })

            .option('rsync.from', {
                alias: ['from', 'f'],
                group: 'Rsync:',
                //demand: true,
                nargs: 1,
                describe: 'origin of files, loacl path',
            })

            .option('rsync.target', {
                alias: ['target', 't'],
                group: 'Rsync:',
                //demand: true,
                nargs: 1,
                describe: 'target of files, can be remote path user@host:path'
            })
            .option('rsync.user', {
                nargs: 1,
                group: 'Rsync:',
                describe: 'remote machine user'
            })
            .option('rsync.host', {
                nargs: 1,
                group: 'Rsync:',
                describe: 'remote host address'
            })
            //over options options
            .option('v', {
                alias: "verbose",
                description: 'set global log level to debug'
            })
            .env("SYNCJS_")
            .usage('Usage: $0 [options] [-- rsync.args]')
            .config('c', "Config file")
            .alias('c', 'config')
            .default('c', './config.json')
            .help('h')
            .alias('h', 'help')
            .epilog('vfrc29@gmail.com, MIT license 2015')
            .argv;

        if (!args.public)
            args.public = './public';

        if (!args.mountpath)
            args.mountpath = '/media';

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
    if (!args.rsync.from || !args.rsync.target)
        throw new ConfigError("Rsync from and target paths are required");
}


