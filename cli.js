var logger = require('./helpers/logger');
var log = require('./helpers/logger')(module);
var io = require('socket.io-client');
var Promise = require('promise');
var url = require('url');
var fs = require('fs');

var request = require('request');
var process = require('process');

var yargs = require("yargs");

log.debug("Starting cli");

startApp(function (app) {

    try {

        statusRsync().then(function (body) {

            if (app.args.command == 'stop') {
                return stopRsync();

            } else if (app.args.command == 'start') {

                if (body.isRunning && !body.isFinished) {
                    return waitRsync();
                }

                if (!app.args.hdd)
                    throw new Error("No path where to sync files");

                data = {
                    path: app.args.hdd || '/tmp',
                    extraArgs: !app.args.hdd ? ['-n'] : []
                };

                return startRsync(data)
                    .then(function () {
                        return waitRsync();
                    });
            } else {
                throw new Error("No such command " + app.args.command);
            }

        }).then(function () {
            log.debug("Application exit");
            process.exit(0);
        }).catch(function (err) {
            log.error(err);
            process.exit(11);
        });


    } catch (err) {

        log.error(err);

        process.exit(1);
    }

    function infoRsync() {

    }

    function startRsync(args) {

        return new Promise(function (resolve, reject) {

            req = {
                method: 'POST',
                url: app.args.apiUrl + '/start',
                json: args
            };

            request(req, function (err, res) {
                try {
                    if (err) {
                        log.error(err);
                        return;
                    }

                    if (res && res.statusCode != 200) {
                        log.error("Error code: " + res.statusCode + res.body);
                        return;
                    }

                    log.debug("Succes start " + res.statusCode);
                    resolve();
                } catch (err) {
                    reject(err);
                }

            })

            function logEvents(event) {
                if (event.type == 'stop')
                    resolve();
            }


        });
    }

    function statusRsync() {

        return new Promise(function (resolve, reject) {

            req = {
                method: 'GET',
                url: app.args.apiUrl + '/status',
            };



            request(req, function (err, res) {
                if (err) {
                    reject(err);
                }

                if (res && res.statusCode != 200) {
                    log.error("Error code: " + res.statusCode + res.body);
                    return;
                }
                try {
                    resolve(JSON.parse(res.body));
                    log.debug("Succes start " + res.statusCode);
                } catch (err) {
                    reject(err);
                }
            });

        });

    }

    function waitRsync() {

        return new Promise(function (resolve, reject) {

            var Progress = require('progress');
            var lastFile = null;
            var pb = null;
            var lastPercent = 0;

            try {

                app.socket.on('rsync.state', logEvents);
                app.socket.on('rsync.progress', logProgress);
            } catch (err) {
                reject(err);
            }

            function logEvents(event) {
                if (event.type == 'stop') {
                    app.socket.off('rsync.state', logEvents);
                    app.socket.off('rsync.progress', logProgress);
                    resolve();
                }
            }

            function logProgress(progress) {

                if (lastFile != progress.filename) {
                    lastFile = progress.filename;
                    lastPercent = 0;
                    console.log(lastFile);
                    pb = new Progress("[:bar] :current% :etas",
                        {
                            width: 20,
                            total: 100
                        });
                }

                if (pb)
                    pb.tick(progress.percent - lastPercent);

                lastPercent = progress.percent;
            }

        });

    }

    function stopRsync() {
        return new Promise(function (resolve, reject) {

            req = {
                method: 'POST',
                url: app.args.apiUrl + '/stop',
            };

            request(req, function (err, res) {
                if (err) {
                    reject(err);
                    return;
                }

                if (res && res.statusCode != 200) {
                    reject("Error code: " + res.statusCode + res.body);
                    return;
                }

                try {
                    log.debug("Succes start " + res.body);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        })
    }


});


function startApp(callback) {

    var args = getConfig();
    logger.setConfing(args);

    log.debug("Connect to socket " + args.url);

    if (!args.url)
        throw new Error("Undefined server url");


    var manager = io.connect(args.url, {
        timeout: 900
    });

    var runned = false;

    manager.on('connect', function () {

        log.debug("Connection success");

        var app = {
            socket: manager,
            args: args
        };

        if (!runned) {
            runned = true;
            callback(app);
        }

    });

    manager.on('connect_error', function (err) {

        log.error("Socket error " + err);
        process.exit(12);

    });

    manager.on('connect_timeout', function () {
        log.error("Socket connection timeout");
        process.exit(13);
    });

}

function getConfig() {

    /**
     * Commandline args:
     *
     * ENV prefix SYNCJS_
     *
     * cli [options] path-to-hdd
     *
     */
    var internalJSON = JSON;

    try {

        log.debug("Getting config");

        //JSON = require('hjson');

        var args = yargs
            .option('url', {
                alias: 'u',
                nargs: 1,
                describe: "api url of the server instance"

            })
            .option('api', {
                alias: 'a',
                nargs: 1,
                describe: "api path of the server instance"
            })
            .option('pid', {
                default: '/var/run/syncjs/api',
                nargs: 1,
                describe: "api file of running server instance"
            })
            .option('n', {
                alias: "dryrun",
                description: 'sdryrun sync job'
            })
            //over options options
            .option('v', {
                alias: "verbose",
                description: 'set global log level to debug'
            })
            .command('start', 'start rsync')
            .command('stop', 'stop rsync work')
            .command('info', 'get list of files')
            .env("SYNCJS_")
            .usage('Connects to syncjs server and start sync job.\n' +
                '\nUsage: $0 <path-to-hdd> [options] [-- rsyncArgs]')
            .config('c', "Config file")
            .alias('c', 'config')
            .default('c', '~/.syncjs.json')
            .help('h')
            .alias('h', 'help')
            .epilog('vfrc29@gmail.com, MIT license 2015')
            .argv;

        if (args._.length < 2) {
            args.command = 'start';
            args.hdd = args._[0] || undefined;
            args.rsyncExtraArgs = args._.slice(1);

        } else if (args._.length >= 1) {
            args.command = args._[0].toLowerCase();
            args.hdd = args._[1] || undefined;
            args.rsyncExtraArgs = args._.slice(2);
        }

        var fromFile = getPidFile(args.pid);

        if (!args.api)
            args.api = fromFile.api;

        if (!args.url)
            args.url = fromFile.url;

        args.apiUrl = url.resolve(args.url, args.api || '');

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

function getPidFile(filename){
    if (fs.existsSync(filename)) {
        var vars = fs.readFileSync(filename, 'utf8').split('\n',3);

        return {
            url: vars[1],
            api: vars[2]
        }
    } else {
        return null;
    }
}