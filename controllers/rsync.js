var log = require('./../helpers/logger')(module);
var reqLog = require('./../helpers/logger')(module, "request");
var Promise = require('promise');
var express = require('express');


function CreateRsyncController(app) {

    var bodyParser = require('body-parser');

    var Rsync = require('./../models/rsync');
    var RsyncError = require('./../helpers/rsync-error');

    var router = express.Router();

    var io = app.appsocket;

    var rsync = new Rsync();
    var rsyncCache = require('./../models/ignore-file-cache');

    router.use(bodyParser.json());

    router.use(function (req, res, next) {
        req.apprsync = rsync;
        next();
    });

    router.use(function (req, res, next) {
        rsyncCache.rsyncConfig = req.appconfig.rsync;
        req.rsyncCache = rsyncCache;
        next();
    });

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

        var rsync = req.apprsync;

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

        var rsync = req.apprsync;

        try {
            if (!(req.appconfig && req.appconfig.rsync))
                next(new RsyncError("No config for rsync!"));

            reqLog.debug("Set rsync config: %s", req.appconfig.rsync);

            reqLog.debug("Start rsync with params: %s", req.body);


            var path = req.body.path;
            var extraArgs = req.body.extraArgs;

            var cachedIgnore = req.rsyncCache.getCachedFile(path)
                .then(function (ignoreFilename) {
                    return "--exclude-from=" + ignoreFilename;
                }).catch(function (err) {
                    log.warn("Error geting ignore cache ", err);
                });

            _setRsyncConf(rsync, req.appconfig.rsync);

            extraArgs.push(cachedIgnore);

            rsync.start(path, extraArgs).then(
                _getSentOk(req, res),
                _getErrAnswer(req, res, next));

        } catch (err) {
            next(err);
        }

        function _setRsyncConf(rsync, conf) {

            rsync.from = conf.from;
            rsync.target = conf.target;
            rsync.defaultArgs = conf.defaultArgs;

        }

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

        var rsync = req.apprsync;

        reqLog.debug("Pending to stop rsync");
        rsync.stop().then(
            _getSentOk(req, res),
            _getErrAnswer(req, res, next)
        );

    });

    /**
     * @api {websocket} rsync.state Event on change rsync process state
     * @apiGroup Websocket Rsync
     * @apiDescription
     * Fire when rsync starts or stops and when change state
     * @apiSuccess {string}     title   Message describe state
     * @apiSuccess [{string}]   type    Enum of type of state can be start, stop or undeifined
     * @apiSuccessExample {json}
     * {
     *      title: "Rsync start"
     *      type: "start"
     * }
     */
    rsync.on('state', function (data) {
        io.emit('rsync.state', data);
    });

    /**
     * @api {websocket} rsync.progress Event copy progress
     * @apiGroup Websocket Rsync
     * @apiDescription
     * Fire when rsync emit progress of copied file
     * @apiSuccess {string}  filename    Name of curently coping file
     * @apiSuccess {int}     size        file size (bytes)
     * @apiSuccess {int}     percent     int 0..100
     * @apiSuccess {int}     speed       int (bits/s)
     * @apiSuccess {string}  est         est time
     * @apiSuccessExample websocket data: {json}
     * {
          filename: "filename.ext",
          size: 1000
          percent: 23,
          speed: 1200,
          est: "3:45 min"
        }
     */
    rsync.on('progress', function (data) {
        io.emit('rsync.progress', data);
    })

    /**
     * @api {websocket} rsync.rawoutput Event new output line
     * @apiGroup Websocket Rsync
     * @apiDescription
     * Fire when rsync emit new output line
     * @apiSuccess {string} line New output line
     */
    rsync.on('rawoutput', function (data) {
        io.emit('rsync.rawoutput', data);
    });

    /**
     * @apiDefine rsyncError
     * @apiError Rsync Error 500
     * @apiErrorExample {json} Error-Response:
     *     HTTP/1.1 500 Internal Server Error
     *     {
     *       "error": "message"
     *     }
     */
    router.use(function rsyncErrorHandler(err, req, res, next) {
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
    });

    return router;
}

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

log.debug('Rsync controller loaded');

module.exports = CreateRsyncController;





