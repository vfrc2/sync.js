/**
 * Created by mlyasnikov on 12.11.2015.
 */
var Promise = require('promise');
var events = require('events');

var RsyncError = require("./../helpers/RsyncError");

var sr = require("./../helpers/scriptRunner");

function createRsync() {
    "use strict";

    var child = null;
    var eventEmiter = new events.EventEmitter();


    this.rsyncCmd = {
        prog: "cat",
        args: [__dirname + '/../tests/models/copy-log.log']
    };

    this.start = start;
    this.stop = stop;
    this.getBuffer = getBuffer;
    this.isRunning = isRunning;
    this.on = function(event, calback){
        eventEmiter.on(event,calback);
    };
    this.removeAllListeners = function(){
        eventEmiter.removeAllListeners();
    };
    this._setCmd = function (cmd){
        this.rsyncCmd = cmd;
    };


    /***
     * Start rsync with config
     * @param config
     * {
     *  path: path to target dir
     *  extraArgs: dop args for rsync
     * }
     * @returns promise
     */
    function start(config) {

        if (!config)
            return Promise.reject(new RsyncError("Null config argument!"));

        if (!config.path)
            return Promise.reject(new RsyncError("Null path argument!"));

        if (this.isRunning())
            return Promise.reject(new RsyncError("Already running!"));

        var args = this.rsyncCmd.args;

        if (config.extraArgs)
            args = args.concat(config.extraArgs);

        //args.push(config.path);

        return sr.spawn(this.rsyncCmd.prog, args,
            {
                detached: false,
                pipe: require('./../helpers/rsyncParser')()
            })
            .then(function (res) {

                res.isRun = true;
                res.buffer = "";
                res.lastProceedFile = null;

                child = res;

                eventEmiter.emit('start', {title: "Process started"});

                res.stdout.encoding = "utf8";
                res.stdout.on('file', function (token) {
                    eventEmiter.emit('file', token);
                });
                res.stdout.on('progress', function (token) {
                    eventEmiter.emit('progress', token);
                });

                res.child.stdout.encoding = 'utf8';
                res.child.stdout.on('data', function(data){
                    eventEmiter.emit('rawoutput', data);
                })

                return res.done.then(function (exitcode) {
                    res.isRun = false;
                    eventEmiter.emit('stop', {exitcode: exitcode});
                    return exitcode;
                }, function (err) {
                    res.isRun = false;
                    eventEmiter.emit('stop', {exitcode: exitcode});
                    throw(err);
                });
            }, function(err){
                throw(err);
            });
    }

    function stop() {
        "use strict";

        if (child != null && !child.isRun)
            throw new RsyncError("Rsync not running!");

        child.kill("SIGTERM");
    }

    function getBuffer() {
        "use strict";

        if (child != null)
            return child.buffer;

        throw new RsyncError("Rsync not running!");
    }

    function isRunning() {
        "use strict";

        if (child != null)
            return child.isRun;
        else
            return false;
    }
}

module.exports.service = new createRsync();
module.exports.create = createRsync;
