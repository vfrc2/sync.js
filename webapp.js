var logger = require('./helpers/logger');
var log = require('./helpers/logger')();

var express = require('express');
var app = express();

try {
    var config = getConfig();

    logger.setConfing(config.log);

    log.log('verbose', "Starting server...");
    var server = app.listen(config.webserver.port, function (err) {
        "use strict";

        if (err != null) {
            consoleError(err);
        }

        log.info("Server start at http://%s:%s", server.address().address, server.address().port);
    });

    var io = require("socket.io")(server);

    log.debug("Setting config", config);
    app.appconfig = config;
    app.appio = io;

    app.use(configMiddleware);

    app.use(express.static('public'));

    app.use(require("./controllers")(app));

    app.use(errorLog);

    app.use(errorHandler);
} catch (err) {
    consoleError(err);
}

function errorLog(err, req, res, next) {
    "use strict";
    log.error(err.message);
    log.debug(err.stack);
    next(err);
};

function errorHandler(err, req, res, next) {
    "use strict";
    res.status(500);
    res.end("Internal server error");
};

function consoleError(err) {

    errorLog(err, undefined, undefined, function () {
        process.exit(1);
    })
}

function configMiddleware(req, res, next) {
    req.appconfig = config;
    next();
}

function getConfig() {

    ///Get cmd line options
    {
        var args = require('yargs')
            .usage('Usage: $0 [options] [-- rsync.args]')

            .option('c', {
                alias: 'config',
                nargs: 1,
                describe: 'config file'
            })

            .option('p', {
                alias: 'port',
                nargs: 1,
                describe: "listen server port default: '3000'",

            })
            .option('r', {
                alias: 'apiroute',
                nargs: 1,
                describe: "api route for service default: '/api'",
            })

            .option('i', {
                alias: 'ignorefile',
                nars: 1,
                description: "name for ignore file placed on ext hdd default: '.syncIgnore' ",
            })

            .option('f', {
                alias: 'from',
                nargs: 1,
                describe: 'origin of files, loacl path',
            })

            .option('t', {
                alias: 'target',
                nargs: 1,
                describe: 'target of files, can be remote path user@host:path'
            })
            .option('tuser', {
                nargs: 1,
                describe: 'remote machine user'
            })
            .option('thost', {
                nargs: 1,
                describe: 'remote host address'
            })
            .option('v', {
                alias: "verbose",
                description: 'set global log level to debug'
            })

            .help('h')
            .alias('h', 'help')
            .epilog('vfrc29@gmail.com, MIT license 2015')
            .argv;
    }

    var config = {
        webserver: {
            port: 3000,
            apiRoute: '/api'
        },
        rsync: {
            //from:  requred path
            //target:  requred string or object
            //        {
            //          path: path on remote machine, from where get ignore filelist
            //          user: optional for ssh args
            //          host: optional for ssh args
            //        }
            ignoreFilename: '.syncIgnore',
            defaultArgs: []
        },

    };

    if (args.verbose)
        logger.setGlobalLevel('debug');

    //rewrite from config file config.json
    {
        var fs = require('fs');
        var configFile = './config.json';

        if (args.config)
            configFile = args.config;

        if (fs.existsSync(configFile)) {
            log.debug("Reading config %s", configFile);
            var jsonconfig = require(configFile);
            if (jsonconfig.webserver) {
                if (jsonconfig.webserver.port)
                    config.webserver.port = jsonconfig.webserver.port;
                if (jsonconfig.webserver.apiRoute)
                    config.webserver.apiRoute = jsonconfig.webserver.apiRoute;
            }

            if (jsonconfig.rsync) {
                if (jsonconfig.rsync.from)
                    config.rsync.from = jsonconfig.rsync.from;

                if (jsonconfig.rsync.target) {
                    if (typeof jsonconfig.rsync.target === 'object') {
                        config.rsync.target = {}
                        if (jsonconfig.rsync.target.path)
                            config.rsync.target.path = jsonconfig.rsync.target.path;
                        if (jsonconfig.rsync.target.user)
                            config.rsync.target.user = jsonconfig.rsync.target.user;
                        if (jsonconfig.rsync.target.host)
                            config.rsync.target.host = jsonconfig.rsync.target.host;
                    } else {
                        config.rsync.target = {
                            path: jsonconfig.rsync.target
                        }
                    }
                }

                if (jsonconfig.rsync.ignoreFilename)
                    config.rsync.ignoreFilename = jsonconfig.rsync.ignoreFilename;
                if (jsonconfig.rsync.defaultArgs)
                    config.rsync.defaultArgs =
                        config.rsync.defaultArgs.concat(jsonconfig.rsync.defaultArgs);


            }
            if (jsonconfig.log) {

                if (typeof(jsonconfig.log) === 'string' &&
                    !fs.existsSync(jsonconfig.log))
                    config.log = undefined;
                else {
                    config.log = jsonconfig.log;
                }
            }


        } else {
            log.warn("No config file '%s'!", configFile);
        }

    }

    //rewrite from commandline args
    {
        if (args.port)
            config.webserver.port = args.port;

        if (args.apiroute)
            config.webserver.apiRoute = args.apiroute;

        if (args.ignorefile)
            config.rsync.ignoreFilename = args.ignorefile;

        if (args.from)
            config.rsync.from = args.from;

        if (args.target)
            config.rsync.target.path = args.target;

        if (args.tuser)
            config.rsync.target.user = args.tuser;

        if (args.thost)
            config.rsync.target.host = args.thost;

        if (args._)
            config.rsync.defaultArgs.concat(args._);
    }

    //checking config

    if (!config.rsync.from)
        throw new Error("Rsync oring path missing");

    if (!config.rsync.target.path)
        throw  new Error("Rsync target path missing!");

    return config;
}

