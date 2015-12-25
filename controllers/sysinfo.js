/**
 * Created by vfrc2 on 17.12.15.
 */

var log = require('./../helpers/logger')(module);
var reqLog = require('./../helpers/logger')(module, "request");

var Promise = require('promise');
var express = require('express');

var Rsync = require('./../models/rsync');
var RsyncError = require('./../helpers/rsync-error');
var BlockInfo = require('./../models/block-info');

function CreateSysinfo(app) {

    var bodyParser = require('body-parser');

    var blockInfo = new BlockInfo(app.appconfig.mountPath);

    blockInfo.settingsFilename = app.appconfig.perDeviceSettings;

    var router = express.Router();

    router.use(bodyParser.json());

    router.use(function (req, res, next) {
        res.setHeader('cache-control', 'no-cache');
        next();
    });

    /**
     * @api {get} /sysinfo Get ext hdd info
     * @apiName GetSysinfo
     * @apiGroup Sysinfo
     * @apiDescription
     * Get drives mounted to /media and stat info about each
     * @apiSuccess (root)       {Object[]}  devices     List of connected devices may be []
     * @apiSuccess (devices)    {Object}    device      Device info object
     * @apiSuccess (device)     {String}    dev         Dev system path /dev/sd*
     * @apiSuccess (device)     {String}    mount       Device mount point
     * @apiSuccess (device)     {Int}       used        Space used on device (byte)
     * @apiSuccess (device)     {Int}       available   Space left on device
     * @apiSuccess (device)     {Int}       size        Size (byte)
     * @apiSuccess (device)     {String}    model       Model name
     * @apiSuccess (device)     {String[]}  ignoreFiles List of file what will be copied (from rsync dryrun)
     * @apiSuccess (device)     {String[]}  warnings    List of non-critical errors while getting device info
     * @apiSuccess (root)       {String[]}  warnings    List of non-critical errors while getting devices info
     * @apiSuccessExample {json} HTTP-1/1 200:
     * {
     *  "warnings": [],
     *  "devices": {
     *      "warnings":[],
     *      "dev":"/dev/sdc1",
     *      "mount":"/media/vfrc2/Transcend",
     *      "used":19655368704,
     *      "available":12456087552,
     *      "size":32111456256,
     *      "model":"Transcend 32GB",
     *      "ignoreFiles":[]
     *  }
     * }
     *@apiUse rsyncError
     */
    router.get('/sysinfo', function (req, res, next) {

        reqLog.debug("Start block dev info");

        var data = {};
        blockInfo.getDevInfo()
            .then(_dryRunDevices(req))
            .then(function (data) {
                res.setHeader('Content-Type', 'application/json');

                res.end(JSON.stringify(data));
                reqLog.debug("Send sysinfo:", data);
            })
            .catch(function (err) {
                if (err)
                    next(err)
            });
    });

    if (app.appsocket) {
        log.debug("Bind new device event to socket");
        blockInfo.on('device.connected', function (result) {
            app.appsocket.emit('blockdev.newdevice', result);
        });
    }


    function _dryRunDevices(req) {

        var me = this;

        return function (deviceResult) {

            log.debug("Getting dry run file lists");

            var deviceList = deviceResult.devices;

            var forceUpdate = req.headers['cache-control'] === 'no-cache';

            if (!deviceList || !deviceList.forEach || !deviceList.length > 0)
                return Promise.resolve(deviceResult);

            var ignoreFile = req.rsyncCache.getCachedFile(null, forceUpdate)
                .then(function (ignoreFilename) {
                    return "--exclude-from=" + ignoreFilename;
                }).catch(function (err) {
                    log.warn("Error getting ignore cache ", err);

                    if (!deviceResult.warning || !deviceResult.warning.push)
                        deviceResult.warning = [];

                    deviceResult.warning.push(err.message);
                    return undefined;
                });

            var promises = [];

            deviceList.forEach(function (device) {
                promises.push(_dryRunDevice(device, ignoreFile, req));
            });

            return Promise.all(promises).then(function () {
                return deviceResult;
            });


        }
    }

    function _dryRunDevice(device, ignoreFile, req) {

        log.debug("Getting  dry run files for " + device.dev);

        var rsync = new Rsync();

        rsync.from = req.appconfig.from;
        rsync.defaultArgs = req.appconfig.defaultArgs;

        return rsync.getFiles(device.mount, ['-n', ignoreFile])
            .then(function (ignoreFiles) {
                device.ignoreFiles = ignoreFiles;
            })
            .catch(function (err) {
                log.warn("Error geting dry run files ", err);
                if (!device.warning.push)
                    device.warning = [];

                device.warning.push(err.message);
                return [];
            })
    }

    return router;
}

log.debug('Sysinfo controller loaded');
module.exports = CreateSysinfo;