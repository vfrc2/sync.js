/**
 * Created by mlyasnikov on 12.11.2015.
 */

var ssplt = require("stream-splitter");
var proc = require('child_process');
var Promise = require('promise');
var events = require('events');

var RsyncError = require("./../helpers/RsyncError");

var sr = require("./../helpers/scriptRunner");

var child = null;

var rsyncCmd = {
    prog: "cat",
    args: [__dirname + '/../tests/models/sync-to-hdd.log']
};

var e = new events.EventEmitter();

function start(config) {

    if (!config)
        return Promise.reject(new RsyncError("Null config argument!"));

    if (!config.path)
        return Promise.reject(new RsyncError("Null path argument!"));

    if (this.isRunning())
        return Promise.reject(new RsyncError("Already running!"));


    return sr.spawn(rsyncCmd.prog, rsyncCmd.args,
        {
            detached: false,
            pipe: require('./../helpers/rsyncParser')()
        })
        .then(function (res) {

            child = res;

            child.isRun = true;
            child.buffer = "";

            _emitStart({title:"Process started"});

            res.stdout.encoding = "utf8";
            res.stdout.on('token', function (token) {
                child.buffer += token + "\n";
                _emitRaw(token+"\n");
                var prog = _parseProgressToken(token);
                if (prog)
                    _emitProgress({title:"Progress", state: prog});

            });

            return res.done.then(function (exitcode) {
                child.isRun = false;
                _emitEnd({exitcode: exitcode});
                return exitcode;
            }, function (err) {
                child.isRun = false;
                _emitEnd({exitcode: -1});
                throw(err);
            });
        });
};

function stop() {
    "use strict";

    if (child != null && !child.isRun)
        throw new RsyncError("Rsync not running!");

    child.child.kill("SIGTERM");

};

function getBuffer() {
    "use strict";

    if (child != null)
        return child.buffer;

    throw new RsyncError("Rsync not running!");
};

function isRunning() {
    "use strict";

    if (child != null)
        return child.isRun;
    else
        return false;
};
//32.77K   0%    0.00kB/s    0:00:00
var percentExpr = new RegExp;
var lastProceedFile = null;
function _parseProgressToken(token) {


    if (!lastProceedFile) {
        if (token.length > 0)
            lastProceedFile = token;
        return null;
    }

    //(558.40M)  (90%)   (18.73MB/s)    (0:00:03)
    var mtch = (/\s*(\d*.\d*[kmg])\s*(\d{1,3}%)\s*(.*\/s)\s*(\d*:\d*:\d*)/igm).exec(token);


    if (mtch && mtch.length > 4) {
        return {
            file: lastProceedFile,
            size: mtch[1].trim(),
            percent: mtch[2].trim(),
            speed: mtch[3].trim(),
            est: mtch[4].trim()
        }
    } else {
        if (token.length > 0)
            lastProceedFile = token;
        return null;
    }
}

function _setCmd(value) {
    rsyncCmd = value;
}

function _emitProgress(data){

    e.emit('progress', data);

}

function _emitStart(data) {
    e.emit('start', data);

}

function _emitEnd(data){
    e.emit('stop', data)
}

function _emitRaw(data){
    e.emit('rawoutput', data);
}

module.exports.start = start;
module.exports.stop = stop;
module.exports.isRunning = isRunning;
module.exports.getBuffer = getBuffer;
module.exports._setCmd = _setCmd;
module.exports.on = function(event, calback){
    e.on(event,calback);
};