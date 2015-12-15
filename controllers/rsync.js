/**
 * @module rsync
 * @description Api for starting, stoping and watch Rsync progress
 * Api accept json objects and answers with json
 * @author Maxim Lyasnikov (vfrc29@gmail.com)
 */

var log = require('./../helpers/logger')(module);
var reqLog = require('./../helpers/logger')(module, "request");

var express = require('express');
var bodyParser = require('body-parser');

var router = express.Router();

var RsyncError = require('./../helpers/RsyncError');
var rsync = require('./../models/rsyncService');
var blockInfo = require('./../models/blockInfo');

router.use(bodyParser.json());

router.use(logApiRequest);

/**
 * @api {get} /status Get rsync status
 * @apiName GetStatus
 * @apiGroup Rsync
 * @apiDescription Get status of running rsync instance
 * @apiSuccess (200){Boolean}  isRunnig  Is Rsync instance running
 * @apiSuccess (200){Boolean}  isFinished  Is Rsync already finished
 * @apiSuccess (200){String[]} outputBuffer Output of rsync stdout and stderr
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "isRunnig": true,
 *       "isFinished": false,
 *       "outputBuffer": [
 *          ...
 *          "file.xsl",
 *          ...
 *         ]
 *     }
 */
router.get('/status', function (req, res, next) {

    try {

        var obj = {
            isRunning: rsync.isRunning(),
            isFinished: rsync.isFinished(),
            outputBuffer: rsync.isRunning() || rsync.isFinished() ? rsync.getBuffer() : []
        };

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(obj));

    } catch (error) {
        next(error);
    }
});

/**
 * @function start
 * @description
 * Start rsync run
 * @param {object} body need to be json object
 *      {
 *          {string} path - full path where to copy file (ext hdd path)
 *          {array} extraArgs - extra args for rsync
 *      }
 * @return HTTP OK or 500 if error
 * if error is RsyncError when it will return {object}
 *      {
 *          {string} error: error message
 *      }
 */
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

/**
 * @function sysinfo
 * @description
 * Get drives mounted to /media and stat info about each
 * @return {object[]}
 */
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

/**
 * @fucntion stop
 * @description Request to stop rsync
 * @return HTTP OK or error
 */
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
/**
 * @description Standart error report
 * @returns {object}
 */
function rsyncErrorHandler(err, req, res, next) {
    if (err instanceof RsyncError) {

        reqLog.error("Rsync error", err.message);
        reqLog.debug("Error stack", err.stack);
        log.error("Rsync error", err.message);
        log.debug("Error stack", err.stack);
        res.statusCode = 500;
        res.end({error: err.message});
        return;
    }
    next(err);
}

function logApiRequest(req, res, next) {
    reqLog.info("Request to %s", req.originalUrl);
    reqLog.debug("From %s", req.hostname, {
        originalUrl: req.originalUrl,
        headers: req.headers,
        data: req.body
    });
    next();
    //reqLog.debug("Response data ", {
    //    headers: res.statusCode,
    //    data: res.body
    //});
}

log.log('verbose', 'Rsync controller loaded');


module.exports = router;





