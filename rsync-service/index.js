//Module to exec rsync command and listen output

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

            if (!config.path)
              callback(new RsyncError("Null path argument!"));

            callback(new RsyncError("test error!"));
            if (child != null)
                callback(new RsyncError("Already running!"));
            
            child = spawn('rsync');

            child.on('exit', function(exitCode) {
                if (exitCode > 0)
                    callback(new RsyncError('Bad exit code1: ' + exitCode));

                callback(null);
            });

            child.on('error', function(error) {
                callback(new Error('Bad exit code2: ' + error.message));
            });

        },

        webApi: function(apiPath, app){
            "use strict";

            app.get(apiPath+'/status', function(req,res){
                //res.statusCode= 404;
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
                };
                res.setHeader('Content-Type','application/json');
                res.end(JSON.stringify(obj));
            });

            var bodyParser = require('body-parser')

            app.use( bodyParser.json() );

            app.use( rsyncErrorHandler);

            app.post(apiPath+'/start', function(req,res,next){

                service.doSync(req.body, function(err){
                    if (err) {
                        next(err);
                        return;
                    }

                    res.statusCode = 200;
                    res.end();
                });
            });

            app.post(apiPath+'/stop', function(req,res){
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
        }
    };

    return service;
    //util.inherits(service, EventEmitter);
    
}

module.exports = new CreateRsyncService();





