/**
 * Created by mlyasnikov on 12.11.2015.
 */


function CreateRsyncService() {
    var curentRunning = null;

    var child = null;

    var blockdev = require("./scripts/blockinfo")

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

        blockdev.getDevInfo().then(
            function(devices) {
                var obj = [];
                devices.forEach(function(dev){

                    obj.push(
                        {
                            name: dev.model,
                            path: dev.mount,
                            stat: {
                                size: dev.size,
                                free: dev.available,
                                used: dev.used
                            },
                            ignoreList: []
                        }
                    )

                });

                callback(null, obj);
            }
        );

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