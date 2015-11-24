/**
 * Created by vfrc2 on 17.11.15.
 */

var proc = require('child_process');
var ssplt = require("stream-splitter");
var Promise = require('promise');
var RsyncError = require('./../helpers/RsyncError');

function getDevInfo() {
    return new Promise(_getDevInfo);
};

function _getDevInfo(resolve, reject) {

    var mnt = proc.spawn(__dirname + "/scripts/blockinfo.sh");

    mnt.on('error', function (err) {
        reject(new Error("Error while start sysinfo! " + err));
    });

    var lmnt = mnt.stdout.pipe(ssplt("\n"));
    lmnt.encoding = "utf8";

    var promises = [];

    lmnt.on("token", function (token) {

        var tkn = token.split(" ", 2);

        var dev = {
            dev: tkn[0],
            mount: tkn[1]
        };


        promises.push(
            Promise.all([getDfinfo(dev), getUdev(dev)])
                .then(function (result) {
                    fillDev(dev, result);
                    return dev;
                })
        );

    });

    mnt.on("close", function (exitcode) {

        if (exitcode != 0) {
            reject(new Error("Sys info not exit clearly! " + exitcode));
            return;
        }

        Promise.all(promises).then(function (result) {
            resolve(result);
        });

    });
}

function getDfinfo(dev) {
    return new Promise(
        function (resolve, reject) {

            var df = proc.spawn("df", [dev.dev,
                "--output=used,avail,size",
                "--block-size=1"]);

            df.on('error', function (err) {
                reject(err);
            });

            var buffer = "";

            df.stdout.on('data', function (data) {
                buffer += data;
            });

            df.on('close', function (exitcode) {

                if (exitcode != 0) {
                    reject(new Error("df exit with " + exitcode));
                    return;
                }

                var lines = buffer.split("\n", 2);
                if (lines < 2) {
                    reject(new Error("Error parsing df output"));
                    return;
                }

                var sizes = lines[1].split(" ", 3);

                if (sizes < 3) {
                    reject(new Error("Error parsing df output"));
                    return;
                }

                var data = [];

                data.push({name: "used", value: parseInt(sizes[0])});
                data.push({name: "available", value: parseInt(sizes[1])});
                data.push({name: "size", value: parseInt(sizes[2])})

                resolve(data);

            });
        }
    );
}

function getUdev(dev) {
    return new Promise(function(resolve, reject){

        var uadm = proc.spawn("udevadm", ["info", "-a", dev.dev]);

        uadm.on('error', function (error) {
            reject(error);
        });

        var ludev = uadm.stdout.pipe(ssplt("\n"));
        ludev.encoding = "utf8";

        var data = [];

        ludev.on("token", function (token) {

            var atr = parseUdevAtr(token);
            if (atr != null) {
                data.push(atr);
            }

        });

        ludev.on("done", function () {
            resolve(data);
        })

    });
}

function parseUdevAtr(token) {
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

function fillDev(dev, atrs) {

    atrs.forEach(function (atr) {

        if (Array.isArray(atr)) {
            fillDev(dev, atr);
        }
        else {
            dev[atr.name] = atr.value;
        }
    });

}

module.exports.getDevInfo = getDevInfo;