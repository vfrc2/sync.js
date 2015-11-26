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
var rsync = require('./../models/rsync').service;
var blockInfo = require('./../models/blockInfo');

router.use(bodyParser.json());

router.get('/status', function (req, res) {

    if (rsync.isRunning()) {
        var obj = {
            state: "running",
            status: rsync.getBuffer()
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

    rsync.start(req.body).then(
        _getSentOk(req,res),
        _getErrAnswer(req,res,next));
});

router.get('/sysinfo', function (req, res, next) {

    var p = blockInfo.getDevInfo();

    p.then(
        function (result) {

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
        },
        _getErrAnswer(req,res,next));
});

router.post('/stop', function (req, res, next) {

    rsync.stop().then(
        _getSentOk(req,res),
        _getErrAnswer(req,res,next)
    );

});

function _getSentOk(req,res){
    return function(){
        res.statusCode = 200;
        res.end();
    }
}
function _getErrAnswer(req, res, next){
    return function(err){
        next(err);
    }
}

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





