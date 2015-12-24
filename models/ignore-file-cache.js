/**
 * Created by vfrc2 on 18.12.15.
 */
var log = require('./../helpers/logger')(module);
var fs = require('fs');
var path = require('path');
var Promise = require('promise');

var Rsync = require('./../models/rsync');

function CreateIgnoreFileCache() {

    var me = this;

    this.cacheFile = '/tmp/syncjs-remote';
    this.cacheTimeout = 5 * 60 * 60 * 1000; //ms ~5 hours
    this.cacheHddFilename = '.syncjsignore';
    this.rsyncTarget = undefined;

    this.cacheFilePromise = undefined;

    this.getCachedFile = function (devicePath, forceUpdate) {

        if (this.cacheFilePromise)
            return this.cacheFilePromise;
        // check local cache if not, load from remote if not when check hdd file cache
        var deviceFile = null;
        if (devicePath)
            deviceFile = path.join(devicePath, cacheHddFilename);

        var me = this;

        log.debug("Check cache in " + this.cacheFile);
        return this.cacheFilePromise = checkFile(this.cacheFile, this.cacheTimeout)
            .then(function (result) {
                if (result || forceUpdate) {
                    log.debug("Cache is fresh");
                    return copyToHdd();
                }

                log.debug("Cache is not fresh, geting from remote");
                return getRemoteFileList(me.cacheFile, me.rsyncTarget)
                    .then(copyToHdd)
                    .catch(function (err) {
                        if (fs.existsSync(deviceFile)) {
                            log.debug("Return hdd cache");
                            return deviceFile;
                        }
                        else {
                            log.warn("No hdd file");
                            return Promise.reject(err);
                        }
                    });

                function copyToHdd() {
                    if (deviceFile) {
                        log.debug("updating hdd " + deviceFile);
                        return copy(me.cacheFile, deviceFile)
                            .then(function (res) {
                                return me.cacheFile;
                            });
                    }
                    else
                        return Promise.resolve(me.cacheFile);
                }
            }).finally(function(){
                me.cacheFilePromise = undefined;
            });
    };
    return this;
}

function checkFile(filename, timeout) {

    if (!timeout)
        timeout = 5000;//ms

    if (!fs.existsSync(filename))
        return Promise.resolve(false);

    var stat = Promise.denodeify(fs.stat);

    return stat(filename).then(function (result) {
        var now = new Date();
        var mtime = result['mtime'];

        return result.size > 0 && now - mtime < timeout;
    });
}

function getRemoteFileList(filename, rsyncTarget) {

    log.debug("Get remote file list in " + filename);
    var rsync = new Rsync();

    rsync.target = rsyncTarget;

    var ws = getNewWS(filename);

    var counter = 0;

    return ws.then(function (stream) {
        return rsync.getRemoteFiles([],
            function (file) {
                stream.write('- ' + path.basename(file.filename) + '\n', 'utf8');
                counter++;
            })
            .then(function (process) {
                return process.done.then(function () {
                    log.debug("Remote complete writed:" + counter);
                    stream.close();
                    return filename;
                });
            });
    });
}

function copy(fileA, fileB) {

    return new Promise(function (resolve, reject) {

        var ws = fs.createWriteStream(fileB);
        ws.on('error', done);

        var rs = fs.createReadStream(fileA);
        rs.on('error', done);
        rs.pipe(ws);

        rs.on('end', function () {
            done();
        });

        function done(err) {
            ws.close();
            rs.close();

            if (err)
                reject(err);
            else
                resolve();
        }

    });
}

function getNewWS(filename) {

    return new Promise(function (resolve, reject) {
        var stream = fs.createWriteStream(filename);

        stream.on('open', function (res) {
            resolve(stream);
        });

        stream.on('error', function (res) {
            reject(res);
        })
    })

}

module.exports = CreateIgnoreFileCache();