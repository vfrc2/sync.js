var logger = require('./helpers/logger');
var log = require('./helpers/logger')(module);

var fs = require('fs');
var request = require('requset');
var process = require('process');

var yargs = require("yargs");

try {
    var args = getConfig();
    logger.setConfing(args);

    var hdd = args.hdd;

    log.debug("Starting cli");

    if (!hdd) {
        log.error("Error specify hdd path");
    }






} catch (err) {
    if (err instanceof ConfigError) {
        yargs.showHelp();
    }
    log.error(err);

    process.exit(1);
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
            .option('pid',{
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

        args.hdd = args._[0] || undefined;
        args.rsyncExtraArgs = args._.slice(1);
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