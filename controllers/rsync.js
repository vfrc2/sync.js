/**
 * Module of web api for rsync
 *
 * Api:
 * /status - return current status of rsync daemon (running or not)
 * /sysinfo - return info about usb devices connected to server
 * /start - exec rsync daemon need path and args
 * /stop - stop rsync daemon
 * /websockerStatus - connect to web socket to recieve current status
 */

var log = require('./../helpers/logger')("rsync-controller");
var reqLog = require('./../helpers/logger').request("rsync-controller-req");

var express = require('express');
var bodyParser = require('body-parser');

var router = express.Router();

var RsyncError = require('./../helpers/RsyncError');
var rsync = require('./../models/rsyncService');
var blockInfo = require('./../models/blockInfo');

router.use(bodyParser.json());

router.use(logApiRequest);

router.get('/status', function (req, res) {

    if (rsync.isRunning()) {
        var obj = {
            state: "running",
            status: rsync.getBuffer()
        }
    } else {
        var obj = {
            state: "not running",
            status: ""
        }
    }

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));

});

router.post('/start', function (req, res, next) {

    try {
        if (!(req.appconfig && req.appconfig.rsync))
            next(new RsyncError("No config for rsync!"));

        reqLog.debug("Set rsync config: %s", req.appconfig.rsync);
        rsync.setConfig(req.appconfig.rsync);
    } catch (err) {
        next(err);
    }

    reqLog.debug("Start rsync with params: %s", req.body);
    rsync.start(req.body).then(
        _getSentOk(req, res),
        _getErrAnswer(req, res, next));
});

router.get('/sysinfo', function (req, res, next) {

    reqLog.debug("Start block dev info");

    blockInfo.getDevInfo.setRsyncConfig(req.appconfig.rsync);

    var p = blockInfo.getDevInfo();

    p.then(
        function (result) {

            // {
            //   warning: "Overal warning!",
            //
            //   devices: [
            //      { warning: "Device warning!", ... }
            //   ]
            //

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
            reqLog.debug("Send sysinfo:", result);
        },
        _getErrAnswer(req, res, next));
});

router.post('/stop', function (req, res, next) {

    reqLog.debug("Pending to stop rsync");
    rsync.stop().then(
        _getSentOk(req, res),
        _getErrAnswer(req, res, next)
    );

});

function _getSentOk(req, res) {
    return function () {
        res.statusCode = 200;
        res.end();
    }
}
function _getErrAnswer(req, res, next) {
    return function (err) {
        next(err);
    }
}

router.use(rsyncErrorHandler);

function rsyncErrorHandler(err, req, res, next) {
    if (err instanceof RsyncError) {

        reqLog.error("Rsync error", err.message );
        reqLog.debug("Error stack", err.stack );
        log.error("Rsync error", err.message );
        log.debug("Error stack", err.stack );
        res.statusCode = 500;
        res.end(err.message);
        return;
    }
    next(err);
}

function logApiRequest(req, res, next){
    reqLog.info("Request to %s", req.originalUrl);
    reqLog.verbose("From %s", req.hostname);
    reqLog.debug("Request data ", {req:{
        originalUrl: req.originalUrl,
        headers: req.headers,
        data: req.body
    }});
    next();
    reqLog.debug("Response data ", {response: {
        headers: res.statusCode,
        data: res.body
    }});
}

log.log('verbose', 'Rsync controller loaded');


module.exports = router;





