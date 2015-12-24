/**
 * Created by mlyasnikov on 12.11.2015.
 */
var log = require('./../helpers/logger')(module);

var Promise = require('promise');
var events = require('events');
var util = require('util');
var path = require('path');
var fs = require('fs');

var RsyncError = require("./../helpers/rsync-error");
var rsyncParser = require('./../helpers/rsync-parser');
var lineParser = require('stream-splitter');

var sr = require("./../helpers/script-runner");

var RSYNC_COMMAND = 'rsync';

function CreateRsync() {
    "use strict";

    events.EventEmitter.call(this);

    var isRun = false;
    var isFinished = false;

    var child = null;

    var outputBuffer = [];

    //options

    this.from = undefined;
    this.target = undefined;
    this.defaultArgs = [];



    //actions

    this.start = function start(path, extraArgs) {

        isRun = true;
        isFinished = false;
        outputBuffer = [];

        var me = this;

        me._checkGlobalArgs();

        return me._resolveArgs(extraArgs)
            .then(me._pushArgs(me.defaultArgs))
            .then(me._pushArgs([me.from, path]))
            .then(me._pushSystemArgs())
            .then(me._getRsyncSpawn())
            .then(me._wireEmitters())
            .then(me._returnDoneHandle())
            .then(function (doneHandle) {

                doneHandle.done.finally(function(){
                    isRun = false;
                    isFinished = true;
                });
                return doneHandle;
            })
            .catch(function (err) {
                throw err;
            });

    };

    this.getFiles = function(path, extraArgs, fileHandler){
        var me = this;

        log.debug("Get files from norm run");

        me._checkGlobalArgs();

        return me._resolveArgs(extraArgs)
            .then(me._pushArgs(me.defaultArgs))
            .then(me._pushArgs([me.from, path]))
            .then(me._pushSystemArgs())
            .then(me._getRsyncSpawn())
            .then(me._wireEmitters())
            .then(function (process) {
                if (fileHandler) {
                    process.stdout.on('file', fileHandler);
                    return me._returnDoneHandle()(process);
                } else
                    return me._returnFileList()(process);
            });
    };

    this.getRemoteFiles = function (extraArgs, fileHandler) {

        var me = this;

        log.debug("Remote run");

        if (!me.target)
            throw new RsyncError("No remote directory");

        return Promise.resolve()
            .then(me._resolveArgs(extraArgs))
            .then(me._pushArgs(['-rn']))
            .then(me._pushArgs([me.target, "/tmp"]))
            .then(me._pushSystemArgs())
            .then(me._getRsyncSpawn())
            .then(me._wireEmitters())
            .then(function (process) {
                if (fileHandler) {
                    process.stdout.on('file', fileHandler);
                    return me._returnDoneHandle()(process);
                } else
                    return me._returnFileList()(process);
            });

    };

    this.stop = function stop() {
        "use strict";

        if (!child || !isRun)
            throw new RsyncError("rsync not running!");

        child.child.kill("SIGTERM");
        log.debug("Send SIGTERM to " + child.child.pid);

        return Promise.resolve();
    };


    //geters

    this.getBuffer = function getBuffer() {
        "use strict";

        if (isFinished || isRun)
            return outputBuffer;

        throw new RsyncError("rsync not running!");
    };

    this.isRunning = function () {
        "use strict";
        return isRun;
    };

    this.isFinished = function () {
        "use strict";
        return isFinished;
    };

    //utils

    this._getRsyncSpawn = function _getRsyncSpawn() {

        var me = this;

        return function (args) {
            log.debug("Run rsync with args " + args);
            return sr.spawn(RSYNC_COMMAND, args,
                {
                    detached: false,
                    pipe: rsyncParser(),
                    pipeErr: lineParser('\n')
                });
        }
    }

    this._resolveArgs = function _resolveArgs(args) {

        return new Promise(function (resolve, reject) {

            log.debug("Resolving args");

            if (args && args.then)
                resolve(args);
            else if (args && args.forEach) {

                var promises = [];

                args.forEach(function (arg) {
                    if (!arg.then)
                        arg = new Promise.resolve(arg);
                    promises.push(arg.then(function(value){
                        if (value)
                            log.debug("Resolve arg: " + value);
                        else
                            log.warn("Can't resolve arg");
                        return value;
                    }));
                });

                resolve(Promise.all(promises).then(function(args){

                    var cleanArgs = [];

                    if (args && args.forEach)
                        args.forEach(function(arg){
                            if (arg)
                                cleanArgs.push(arg);
                            else
                                log.warn("Bad arg!")
                        });
                    else if (args)
                        cleanArgs.push(args);

                    return cleanArgs;
                }));
            } else
                resolve(Promise.resolve(args))
        })

    };

    this._pushArgs = function _pushArgs(extraArgs) {


        return function (args) {

            log.debug("Push args " + extraArgs);

            var cmdArgs = [];

            if (args)
                cmdArgs = cmdArgs.concat(args);

            cmdArgs = cmdArgs.concat(extraArgs);

            return cmdArgs;
        }

    };

    this._pushSystemArgs = function _pushSystemArgs() {

        return function (args) {

            log.debug("System args")

            var cmdArgs = [];

            if (args)
                cmdArgs = cmdArgs.concat(args);

            cmdArgs.push("--progress");
            cmdArgs.push("--out-format=" + rsyncParser.RSYNC_FORMAT);

            return cmdArgs;
        }
    };

    this._wireEmitters = function _wireEmitters() {
        var me = this;

        return function (process) {

            log.debug("Wire events");

            child = process;

            process.stdout.encoding = "utf8";
            process.stderr.encoding = "utf8";

            process.stdout.on('file', function (token) {
                me.emit('file', token);
            });
            process.stdout.on('progress', function (token) {
                me.emit('progress', token);
            });
            process.stdout.on('line', function (data) {
                me.emit('rawoutput', data);
                outputBuffer.push(data);
                log.debug(data);
            });
            process.stderr.on("token", function (data) {
                me.emit('rawoutput', data);
                outputBuffer.push(data);
                log.debug(data);
            });

            return process;
        }
    }

    this._returnDoneHandle = function _returnDoneHandle() {
        var me = this;
        return function (process) {
            me.emit('state', {title: "Start coping files", type: 'start'});

            return {
                done: process.done
                    .then(function (exitcode) {
                        log.debug("Rsync finished");
                        me.emit('state', {title: "Rsync finished", type: 'stop'});
                        return exitcode;
                    }).catch(function (err) {
                        me.emit('state', {title: "Rsync exited with error " + err.message, type: 'crash'});
                        throw(new RsyncError("rsync run error " + err.message));
                    })
            };

        }
    };

    this._returnFileList =  function _returnFileList() {
        var me = this;

        return function (process) {

            var fileList = [];

            process.stdout.encoding = "utf8";

            process.stdout.on('file', function (file) {
                if (file.operation === 'COPY')
                    fileList.push(file);
            });

            return process.done.then(function(){

                return fileList;
            });
        }

    }

    this._checkGlobalArgs = function(){
        log.debug("Check global args");

        if (!this.from)
            throw new RsyncError("Empty from directory");

    }

}

util.inherits(CreateRsync, events.EventEmitter);

CreateRsync.setRsyncCommand = function(cmd){
    RSYNC_COMMAND = cmd;
};

module.exports = CreateRsync;
