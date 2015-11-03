//Module to exec rsync command and listen output
var express = require('express');
var spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;

var RsyncError = require('./error');

// run rsync
// 
// doSync(config, function(err, result))
//

function CreateRsyncService()
{
    var curentRunning = null;
    
    var child = null;

    var service = {
        
        doSync: function(config, callback) {

            if (!config.path) {
                callback(new RsyncError("Null path argument!"));
                return;
            }

            //callback(new RsyncError("test error!"));
            if (child != null) {
                callback(new RsyncError("Already running!"));
                return;
            }

            setTimeout(function(){
                "use strict";
                child = {name: 'Running...'}
            }, 5000);

            callback(null);
            //child = spawn('rsync');
            //
            //child.on('exit', function(exitCode) {
            //    if (exitCode > 0)
            //        callback(new RsyncError('Bad exit code1: ' + exitCode));
            //
            //    callback(null);
            //});
            //
            //child.on('error', function(error) {
            //    callback(new Error('Bad exit code2: ' + error.message));
            //});
        },

        isRunning: function(){
            "use strict";

            if (child == null)
                return null;
            else
                return child.name;
        }

    };

    service.router = InitRouter(service);

    return service;
}

function InitRouter(service){
    "use strict";
    var router = express.Router();

    var bodyParser = require('body-parser')

    router.use( bodyParser.json() );

    router.use( rsyncErrorHandler);

    router.get('/status', function(req,res){
        //res.statusCode= 404;

        var stat = service.isRunning();

        if (stat != null)
        {
            var obj = {
                state: "running",
                status: stat.name
            }
        } else {

        var obj =
        {
            state: "not running",
            data: [
                {
                    name: "Trancent 500Gb",
                    path: "/media/usb0/downlodads/",
                    stat: {
                        size: 495000000,
                        free: 4000000
                    },
                    ignoreList: [
                        "movies/movie1.mkv",
                        "sreries/serie name/series.name.s0.e0.mpg",
                        "sreries/serie name/series.name.s0.e2.mpg"
                    ]
                },
                {
                    name: "JetFlash 4Gb",
                    path: "/media/usb1/transfer/",
                    stat: {
                        size: 3000000,
                        free: 1000000
                    },
                    ignoreList: [
                        "movies/movie1.mkv",
                        "sreries/serie name/series.name.s0.e0.mpg",
                        "sreries/serie name/series.name.s0.e2.mpg"
                    ]
                }]
        }};

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

module.exports = new CreateRsyncService().router;





