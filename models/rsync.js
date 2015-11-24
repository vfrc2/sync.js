/**
 * Created by mlyasnikov on 12.11.2015.
 */

var RsyncError = require("./../helpers/RsyncError");

var curentRunning = null;

var child = null;

var buffer = "";

var ssplt = require("stream-splitter");
var proc = require('child_process');

module.exports.doSync = function (config, progress, callback) {

    if (!config.path) {
        callback(new RsyncError("Null path argument!"));
        return;
    }

    //callback(new RsyncError("test error!"));
    if (this.isRunning()) {
        callback(new RsyncError("Already running!"));
        return;
    }

    buffer = "";

    child = proc.spawn("ping", ["8.8.8.8"], {detached: false});

    child.on('error', function (error) {
        console.log("Error while udevadm")
        //callback(new RsyncError("Error while run rsync: " + error));
    });

    var ludev = child.stdout.pipe(ssplt("\n"));
    ludev.encoding = "utf8";

    ludev.on('data', function (data) {
        buffer += data;
        progress(data);
    });

    callback(null);
};

module.exports.stopRsync = function (callback) {

    if (this.isRunning()) {

        child.kill("SIGTERM");
        callback(null);


    } else {
        callback(new RsyncError("Rsync not running!"));
    }

};

module.exports.getBuffer = function () {
    return buffer;
}

module.exports.isRunning = function () {
    "use strict";

    if (child != null && child.connected)
        return true;
    else
        return false;
};