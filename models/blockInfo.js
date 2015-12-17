/**
 * Created by vfrc2 on 17.11.15.
 */

var Promise = require('promise');
var RsyncError = require('./../helpers/RsyncError');
var Rsync = require('./rsync');
var sr = require('./../helpers/scriptRunner');
var log = require('./../helpers/logger')(module);

var MOUNT_PATH = '/mnt';

function getDevInfo() {

    log.debug("Start 'mount | grep /media'");
    var bi = sr.spawn(__dirname + "/scripts/blockinfo.sh",
        [MOUNT_PATH],
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
                            getUdev(dev),
                            getRsyncDryrunFile(dev)
                                .catch(function (err) {
                                    log.error("Dev '%s'  get info error", dev.dev, err);
                                    deviceWarning.push("Error geting ignore file list " +
                                        err.message);
                                    return [];
                                })
                        ])
                        .then(function (result) {
                            _fillDev(dev, result);

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

                if (!(devices && devices.length > 0)) {
                    overalWarning.push("No devices!");
                }

                var response = {
                    warning: overalWarning,
                    devices: devices
                };

                return response;

            });
        });

    });

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

        result.stdout.encoding = 'utf8';
        result.stdout.on('token', function (token) {
            try {
                var atr = _parseUdevAtr(token);

                if (atr != null) {
                    data.push(atr);
                }
            } catch (err) {
                errs.push(err)
            }
        });

        return result.done.then(function () {

            if (errs.length > 0)
                throw(new Error("Error parse udev output " + errs));
            log.debug("get udev atrs: %s", data);
            return data;
        })

    });
}

function getRsyncDryrunFile(dev) {
    try {
        var rsync = new Rsync();

        var ignoreList = [];

        rsync.on('file', function (data) {

            ignoreList.push(data);
            //pushToTree(data.filename, data);
        });

        var args = {
            path: dev.mount,
            extraArgs: ["-n"]
        };

        rsync.setConfig(getDevInfo._rsyncConfig);

        log.debug("Start 'rsync dryrun'");
        log.debug("rsync args: %s", args);

        function delay(time){
            return new Promise(function (resolve){
               setTimeout(resolve, time);
            });
        }



        return delay(5000)
            .then(function(){
                return rsync.start(args);
            })
            .then(function (res) {
                return res.done;
            })
            .then(function (res) {
                log.debug("rsync ignore files count: %s", ignoreList.length);
                return {name: 'ignoreList', value: ignoreList};
            });
    } catch (err) {
        log.error("Rsync dry run error: %s", err.message);
        log.debug("Rsync dry run stack", err.stack);
        return Promise.reject(err);
    }
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

    if (token.name == "ATTRS{model}")
        return {name: "model", value: token.value};
    else if (token.name == "ATTR{vendor}")
        return {name: "vendor", value: token.value};
    else
        return null;
}

function _fillDev(dev, atrs) {

    atrs.forEach(function (atr) {

        if (Array.isArray(atr)) {
            _fillDev(dev, atr);
        }
        else {
            dev[atr.name] = atr.value;
        }
    });

}

getDevInfo._rsyncConfig = {}

getDevInfo.setRsyncConfig = function (config) {
    getDevInfo._rsyncConfig = config;
};

getDevInfo.setConfig = function(config){
    if (config.mountPath)
        MOUNT_PATH = config.mountPath;
};



module.exports.getDevInfo = getDevInfo;