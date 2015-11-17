//Module to exec rsync command and listen output
var express = require('express');
var spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;

var RsyncError = require('./error');

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

function CreateWebService(){
    "use strict";

    var service = require('./service');
    console.log(service);
    return  InitRouter(service);
}

function InitRouter(service){
    "use strict";
    var router = express.Router();

    var bodyParser = require('body-parser')

    router.use( bodyParser.json() );

    router.use( rsyncErrorHandler);

    router.get('/status', function(req,res){

        var stat = service.isRunning();

        if (stat != null)
        {
            var obj = {
                state: "running",
                status: stat.name
            }
        } else {
            var obj = {
                state: "not running",
                status: null
            }
        }

        res.setHeader('Content-Type','application/json');
        res.end(JSON.stringify(obj));
    });

    router.post('/start', function(req,res,next){

        service.doSync(req.body,
            function(err){
            if (err) {
               return next(err);
            }

            res.statusCode = 200;
            res.end();
        });
    });

    router.get('/sysinfo', function (req, res, next) {

        service.sysinfo(function(err, result){
            if (err){
                next(err);
                return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
        });

    });

    router.post('/stop', function(req,res){
        res.statusCode=404;
        res.end("Not ready yet!");
    });

    function rsyncErrorHandler(err,req,res,next){
        if (err instanceof RsyncError)
        {
            res.statusCode = 500;
            res.end(err.message);
            return;
        }
        next(err);
    }

    return router;
}

module.exports = CreateWebService();





