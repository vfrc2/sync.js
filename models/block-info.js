/**
 * Created by vfrc2 on 17.11.15.
 */

var Promise = require('promise');
var fs = require('fs');
var path = require('path');
var events = require('events');
var util = require('util');

var RsyncError = require('./../helpers/rsync-error');
var Rsync = require('./rsync');
var sr = require('./../helpers/script-runner');
var log = require('./../helpers/logger')(module);


function CreateBlockInfo(mountPath) {

    var me = this;

    this.mountPath = mountPath;
    this.settingsFilename = undefined;

    this.getDevInfo = function () {
        return getDevInfo(this.mountPath);
    };

    log.debug("Set watcher for dir " + this.mountPath);
    var watcher = fs.watch(this.mountPath, function (event, filename) {
        log.debug("Dir " + me.mountPath + "  trigered: " + event);
        //if (event === 'change')
        //needed because when inotify fire event, system no yet mount drive
        setTimeout(function () {
            me.emit('device.connected', filename);
        }, 1000);

    });

    function getDevInfo() {

        log.debug("Start 'mount | grep " + me.mountPath + "'");
        var bi = sr.spawn(__dirname + "/scripts/blockinfo.sh",
            [me.mountPath],
            {
                pipe: require("stream-splitter")('\n')
            });

        return bi.then(function (process) {

            var promises = [];

            process.stdout.encoding = 'utf8';

            var overalWarning = [];

            process.stdout.on("token", function (token) {
                try {
                    log.debug("Get dev string '%s'", token);
                    var tkn = token.split(" ", 2);

                    var dev = {
                        dev: tkn[0],
                        mount: tkn[1]
                    };

                    log.debug("Parse dev: %s", dev);

                    var deviceWarning = [];

                    promises.push(
                        Promise.all(
                            [
                                getDfinfo(dev),
                                getUdev(dev).catch(function(err){
                                    deviceWarning.push(err.message);
                                    return undefined;
                                }),
                                getPerDeviceSettings(dev, me.settingsFilename)
                                    .catch(function (err) {
                                        deviceWarning.push("Err while parse per dev config: " + err.message);
                                        return undefined;
                                    })
                            ])
                            .then(function (result) {

                                _fillDev(dev, cleanList(result));

                                if (!dev.model)
                                    dev.model = dev.dev;

                                dev.warning = [];

                                if (deviceWarning.length)
                                    dev.warning = deviceWarning;

                                return dev;
                            })
                            .catch(function (err) {
                                log.error("Dev '%s'  get info error", dev.dev, err.message);
                                log.debug("Dev: ", dev.dev, err.stack);

                                overalWarning.push("Error while parse dev " + dev.dev +
                                    " " + err.message);

                                return undefined;
                            })
                    );
                } catch (err) {
                    log.error("Devinfo error", err.message);
                    log.debug("Devinfo stack", err.stack);
                    overalWarning.push("Error while parse devices! " +
                        " " + err.message);
                }
            });

            return process.done.then(function () {
                return Promise.all(promises).then(function (devices) {

                    devices = cleanList(devices);

                    if (!(devices && devices.length > 0)) {
                        overalWarning.push("No devices!");
                    }
                    return {
                        warning: overalWarning,
                        devices: devices
                    };
                });
            });

        });

    }

}

util.inherits(CreateBlockInfo, events.EventEmitter);

function cleanList(list){

    var cleanedList = [];

    for (var i in list)
        if (list[i])
            cleanedList.push(list[i]);

    return cleanedList;
}

function getDfinfo(dev) {

    var args = [
        dev.dev,
        "--output=used,avail,size",
        "--block-size=1"
    ];

    log.debug("Start 'df'");
    log.debug("Df args: %s", args);

    var df = sr.spawn("df", args, {
        pipe: require("stream-splitter")('\n')
    });

    //throw new Error("test error");

    return df.then(function (process) {

        var buffer = "";

        process.stdout.encoding = 'utf8';
        process.stdout.on("token", function (token) {

            buffer += token + '\n';

        });

        return process.done.then(function (exitcode) {

            if (exitcode != 0)
                throw new Error("df exit with " + exitcode);

            return _parseDfBuffer(buffer);
        });
    });
}

function getUdev(dev) {

    var args = ["info", "-a", dev.dev];

    log.debug("Start 'udevadm'");
    log.debug("Udevadm args: %s", args);


    var uadm = sr.spawn("udevadm", args,
        {
            pipe: require("stream-splitter")('\n')
        });

    return uadm.then(function (result) {

        var data = [];

        var errs = [];

        //throw new Error("Error spawn udevadm");

        result.stdout.encoding = 'utf8';
        result.stdout.on('token', function (token) {
            try {
                var atr = _parseUdevAtr(token);

                if (atr != null && !data.some(checkExists, atr)) {
                    data.push(atr);
                }
            } catch (err) {
                errs.push(err)
            }
        });

        function checkExists(cur, index, array) {
            return this.name === cur.name;
        }

        return result.done.then(function () {

            if (errs.length > 0)
                throw(new Error("Error parse udev output " + errs));
            log.debug("get udev atrs: %s", data);
            return data;
        })

    });
}

var readFile = Promise.denodeify(fs.readFile);

function getPerDeviceSettings(dev, settingFilename) {

    var filename = path.join(dev.mount, settingFilename);


    log.debug("Getting per device config " + filename);
    return readFile(filename).then(function (data) {
        var config = JSON.parse(data);

        if (config.path) {
            log.debug("Setting new mount path " + config.path);
            dev.originMount = dev.mount;
            dev.mount = path.join(dev.mount, config.path);
        }

        return {name: "setting", value: config};
    }).catch(function (err) {
        if (err.code && err.code === 'ENOENT') {
            log.debug("No per device settings found");
            return {};
        }
        return Promise.reject(err);
    });

}

function _parseDfBuffer(buffer) {
    var lines = buffer.split("\n", 2);

    if (lines.length < 2)
        throw(new Error("Error parsing df output"));

    var sizes = lines[1].split(" ", 3);

    if (sizes.length < 3)
        throw(new Error("Error parsing df output"));

    var data = [];

    data.push({name: "used", value: parseInt(sizes[0])});
    data.push({name: "available", value: parseInt(sizes[1])});
    data.push({name: "size", value: parseInt(sizes[2])});

    return data;
}

function _parseUdevAtr(token) {
    var tkn = token.split("==", 2);

    if (tkn.length < 2)
        return null;

    var token = {
        name: tkn[0].trim(),
        value: tkn[1].replace(/\"/g, "").trim()
    };

    if (token.name === "ATTRS{model}")
        return {name: "model", value: token.value};
    else if (token.name === "ATTR{vendor}")
        return {name: "vendor", value: token.value};
    else if (token.name === "ATTRS{serial}")
        return {name: "serial", value: token.value};
    else
        return null;
}

function _fillDev(dev, atrs) {

    atrs.forEach(function (atr) {

        if (Array.isArray(atr)) {
            _fillDev(dev, atr);
        }
        else {
            if (atr.name && atr.value)
                dev[atr.name] = atr.value;
        }
    });

}

module.exports = CreateBlockInfo;