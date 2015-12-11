/**
 * Created by mlyasnikov on 12.11.2015.
 */
var log = require('./../helpers/logger')();
var Promise = require('promise');
var events = require('events');

var RsyncError = require("./../helpers/RsyncError");

var sr = require("./../helpers/scriptRunner");
var rsyncCmd = "rsync";

var path = require('path');
var fs = require('fs');

function createRsync() {
    "use strict";

    var isRun = false;
    var child = null;
    var eventEmiter = new events.EventEmitter();

    var from = undefined;
    var target = undefined;
    var targetUser = undefined;
    var targetHost = undefined;
    var ignoreFileName = '.ignore';
    var rsyncArgs = [];

    var rsyncParser = require('./../helpers/rsyncParser');

    var ignoreCacheLastWrite = null;

    this.on = function (event, calback) {
        eventEmiter.on(event, calback);
    };
    this.removeAllListeners = function () {
        eventEmiter.removeAllListeners();
    };

    /***
     * Start rsync with args
     * @param args
     * {
     *  path: path to target dir
     *  extraArgs: dop args for rsync
     * }
     * @returns promise
     */
    this.start = function start(args) {

        if (!args)
            return Promise.reject(new RsyncError("Null args argument!"));

        if (!from)
            throw new RsyncError("From path is bad '" + this.from + "'");

        if (this.isRunning())
            return Promise.reject(new RsyncError("Already running!"));

        var cmd_args = [];

        if (rsyncArgs && rsyncArgs.length > 0)
            cmd_args = cmd_args.concat(rsyncArgs);

        cmd_args.push(from);
        cmd_args.push(args.path);

        if (args.extraArgs && args.extraArgs.length > 0)
            cmd_args = cmd_args.concat(args.extraArgs);

        //For parser
        cmd_args.push("--out-format=" + rsyncParser.RSYNC_FORMAT);
        cmd_args.push("--progress");

        eventEmiter.emit('start', { title: "Process started"});

        isRun = true;
        var me = this;
        return this._writeIgnoreCache(args)
            .then(function () {
                log.debug("Rsync args", cmd_args);
                return me._getRsyncSpawn(cmd_args)
            })
            .then(function (res) {

                child = res;

                eventEmiter.emit('progress', { state: {file: "Start coping files", percent: 0}});

                res.stdout.encoding = "utf8";
                res.stdout.on('file', function (token) {
                    eventEmiter.emit('file', token);
                });
                res.stdout.on('progress', function (token) {
                    eventEmiter.emit('progress', token);
                });

                res.stdout.encoding = 'utf8';
                res.stdout.on('line', function (data) {
                    eventEmiter.emit('rawoutput', data);
                    log.debug(data);
                })

                return {done:  res.done.finally(function () {
                        isRun = false;
                    })
                    .then(function (exitcode) {
                        eventEmiter.emit('stop', {exitcode: exitcode});
                        return exitcode;
                    }).catch(function (err) {
                        eventEmiter.emit('stop', {exitcode: -1});
                        throw(new RsyncError("rsync run error " + err.message));
                    })};

            });

    };

    this.stop = function stop() {
        "use strict";

        if (child != null && !child.isRun)
            throw new RsyncError("rsync not running!");

        child.kill("SIGTERM");
    }

    this.getBuffer = function getBuffer() {
        "use strict";

        if (child != null)
            return child.buffer;

        throw new RsyncError("rsync not running!");
    }

    this.isRunning = function isRunning() {
        "use strict";

        if (child != null)
            return child.isRun;
        else
            return false;
    }

    this.setConfig = function (config) {

        if (config.target)
            target = config.target;

        if (config.user)
            targetUser = config.user;

        if (config.host)
            targetHost = config.host;

        if (config.from)
            from = config.from;

        if (config.ignoreFilename)
            ignoreFileName = config.ignoreFilename;

        if (config.defaultArgs)
            rsyncArgs = config.defaultArgs;


    };

    this._getRsyncSpawn = function _getRsyncSpawn(args) {
        return sr.spawn(rsyncCmd, args,
            {
                detached: false,
                pipe: rsyncParser()
            })
    }

    this._writeIgnoreCache = function (config) {

        if (!config.path)
            throw new RsyncError("Can't get origin path");

        if (!(target && target.path))
            throw new RsyncError("Can't get remote path")

        var now = new Date();

        var ignorefile = path.join(config.path, ignoreFileName);

        console.log(__dirname);
        var notExist = !fs.existsSync(ignorefile);
        if (!notExist && ignoreCacheLastWrite &&
            ((now - ignoreCacheLastWrite) < ignoreCacheTimeout))
            return;

        var args = [];

        args.push("-r");
        args.push("--out-format=" + rsyncParser.RSYNC_FORMAT);
        args.push(target.path);
        args.push("/tmp");
        args.push("-n");

        if (targetHost && targetUser)
            args.push("-e 'ssh -l " + targetUser + " " + targetHost);

        var me = this;

        var ignoreStream = null;

        return getWriteFileStream(ignorefile)
            .then(function (stream) {
                ignoreStream = stream;
                log.debug("Rsync (ignore files update) start args", args);
                return me._getRsyncSpawn(args)
            })
            .then(function (res) {

                eventEmiter.emit('progress', {state: {file: "Getting ignore file from target"} });
                res.stdout.encoding = "utf8";
                res.stdout.on('file', function (token) {
                    var ignoreLine =
                        "- " + path.basename(token.filename);
                    ignoreStream.write(ignoreLine + '\n');
                });

                return res.done.finally(
                    function () {
                        ignoreStream.end();
                    });

            });

    };

    function getWriteFileStream(filename) {
        return new Promise(function (resolve, reject) {

            var fpath = path.resolve(filename);

            var stream = fs.createWriteStream(fpath, {
                encoding: 'utf8',
                flags: 'w'

            });

            stream.on('open', function () {
                resolve(stream);
            });
            stream.on('error', function (err) {
                reject(new RsyncError(err.message))
            });
        });
    }
}

module.exports = createRsync;
