/**
 * Created by vfrc2 on 17.11.15.
 */

var Promise = require('promise');
var RsyncError = require('./../helpers/RsyncError');
var Rsync = require('./../models/rsync').create;
var sr = require('./../helpers/scriptRunner');


function getDevInfo() {

    var bi = sr.spawn(__dirname + "/scripts/blockinfo.sh",
        [],
        {
            pipe: require("stream-splitter")('\n')
        });

    return bi.then(function (process) {

        var promises = [];

        process.stdout.encoding = 'utf8';

        process.stdout.on("token", function (token) {

            try {
                var tkn = token.split(" ", 2);

                var dev = {
                    dev: tkn[0],
                    mount: tkn[1]
                };


                promises.push(
                    Promise.all(
                        [getDfinfo(dev), getUdev(dev), getRsyncDryrunFile(dev)])
                        .then(
                            function (result) {
                                _fillDev(dev, result);
                                return dev;
                            })
                );
            } catch (err) {

            }
        });

        return process.done.then(function () {
            return Promise.all(promises);
        });

    });

}

function getDfinfo(dev) {

    var df = sr.spawn("df", [dev.dev,
        "--output=used,avail,size",
        "--block-size=1"], {
        pipe: require("stream-splitter")('\n')
    });

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

    var uadm = sr.spawn("udevadm", ["info", "-a", dev.dev],
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

            return data;
        })

    });
}

var Path = require('path');

function getRsyncDryrunFile(dev) {
    var rsync = new Rsync();

    var ignoreList = [];

    rsync.on('file', function (data) {

        ignoreList.push(data);
        //pushToTree(data.filename, data);
    });

    //function pushToTree(filename, value) {
    //
    //    var path = filename.split(Path.sep);
    //
    //    var curNode = ignoreList;
    //
    //    for (var i = 0; i < path.length; i++) {
    //
    //        if (i == path.length - 1) {
    //            curNode.childs.push({name: path[i], data: value});
    //            break;
    //        }
    //
    //        var find = null;
    //        for (var j = 0; j < curNode.childs.length; j++) {
    //            if (path[i] === curNode.childs[j].name) {
    //                find = curNode.childs[j];
    //                break;
    //            }
    //        }
    //
    //        if (!find) {
    //            find = {name: path[i], childs: []};
    //            curNode.childs.push(find);
    //        }
    //
    //        curNode = find;
    //
    //
    //    }
    //
    //
    //}

    return rsync.start({
            path: dev.mount,
            //extraArgs: ["-n"]
        })
        .then(function (res) {
            return {name: 'ignoreList', value: ignoreList};
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

module.exports.getDevInfo = getDevInfo;