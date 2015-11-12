/**
 * Created by mlyasnikov on 12.11.2015.
 */


function CreateRsyncService() {
    var curentRunning = null;

    var child = null;

    this.doSync = function (config, callback) {

        if (!config.path) {
            callback(new RsyncError("Null path argument!"));
            return;
        }

        //callback(new RsyncError("test error!"));
        if (child != null) {
            callback(new RsyncError("Already running!"));
            return;
        }

        child = {name: 'Running...'}

        setTimeout(function () {
            "use strict";
            child = null;

        }, 10000);

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
    };

    this.sysinfo = function(callback){
        "use strict";

        var obj =
            [
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
                }];

        setTimeout(function () {
            callback(null, obj);
        },2000);

    };

    this.isRunning = function () {
        "use strict";

        if (child == null)
            return null;
        else
            return child.name;
    };



}

module.exports = new CreateRsyncService();