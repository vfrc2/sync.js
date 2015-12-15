/**
 * @apiDefine rsyncError
 * @apiError Rsync Error 500
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "message"
 *     }
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
 * @apiDescription
 * Get status of running rsync instance
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
 * @apiUse rsyncError
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
 * @api {post} /start Start rsync
 * @apiName PostStart
 * @apiGroup Rsync
 * @apiDescription
 * Start rsync process
 * @apiParam {string} path Path to external hdd
 * @apiParam {string[]} extraArgs Extra args for rsync
 * @apiParamExample {json} Request-Example:
 *       {
 *          "path": "full path where to copy file (ext hdd path)",
 *          "extraArgs": "extra args for rsync"
 *      }
 * @apiUse rsyncError
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
 * **
 * @api {get} /sysinfo Get ext hdd info
 * @apiName GetSysinfo
 * @apiGroup Rsync
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
 * @apiSuccess (device)     {String[]}  ignoreList  List of file what will be copied (from rsync dryrun)
 * @apiSuccess (device)     {String[]}  warnings    List of non-critical errors while getting device info
 * @apiSuccess (root)       {String[]}  warnings    List of non-critical errors while getting devices info
 * @apiSuccessExample {json} HTTP-1/1 200:
 * [
 *  {
 *      "dev":"/dev/sdc1",
 *      "mount":"/media/vfrc2/Transcend",
 *      "used":19655368704,
 *      "available":12456087552,
 *      "size":32111456256,
 *      "model":"Transcend 32GB",
 *      "ignoreList":[]
 *  }
 * ]
 *@apiUse rsyncError
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
 * @api {post} /stop Stop running rsync
 * @apiName PostStop
 * @apiGroup Rsync
 * @apiDescription
 * Request to stop running rsync
 * @apiUse rsyncError
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

//json} Error-Response:
//*     HTTP/1.1 500 Internal Server Error
//*     {
//*       "error": "message"
//*     }
function rsyncErrorHandler(err, req, res, next) {
    if (err instanceof RsyncError) {

        reqLog.error("Rsync error", err.message);
        reqLog.debug("Error stack", err.stack);
        log.error("Rsync error", err.message);
        log.debug("Error stack", err.stack);
        res.statusCode = 500;
        res.end(JSON.stringify({error: err.message}));
        return
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





