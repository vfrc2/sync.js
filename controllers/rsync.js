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

var express = require('express');
var bodyParser = require('body-parser');

var router = express.Router();

var RsyncError = require('./../helpers/RsyncError');
var rsyncService = require('./../models/rsync');
var blockInfo = require('./../models/blockInfo');

router.use(bodyParser.json());

router.get('/status', function (req, res) {

    if (rsyncService.isRunning()) {
        var obj = {
            state: "running",
            status: rsyncService.getBuffer()
        }
    } else {
        var obj = {
            state: "not running",
            status: null
        }
    }

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));
});

router.post('/start', function (req, res, next) {

    rsyncService.doSync(req.body,
        function (progress) {
            //console.log("Proc: "+progress);
        },
        function (err) {
            if (err) {
                return next(err);
            }


            res.statusCode = 200;
            res.end();
        });
});

router.get('/sysinfo', function (req, res, next) {

    var p = blockInfo.getDevInfo();

    p.then(
        function (result) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
        },
        function (err) {
            next(err);
        });
});

router.post('/stop', function (req, res, next) {

    rsyncService.stopRsync(function (err) {
        if (err) {
            next(err);
        }
        res.statusCode = 200;
        res.end();
    })

});

router.use(rsyncErrorHandler);

function rsyncErrorHandler(err, req, res, next) {
    if (err instanceof RsyncError) {
        res.statusCode = 500;
        res.end(err.message);
        return;
    }
    next(err);
}

module.exports = router;





