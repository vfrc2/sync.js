/**
 * Created by mlyasnikov on 31.10.2015.
 */

var myApp = angular.module('my-app');

myApp.factory("rsync", ['$http', function($http) {
    "use strict";

    var isRunning = false;
    var runningStatus = null;

    var progressCallBack = null;

    var me = {};

    me.status = function() {

        if (isRunning)
            return {
                state: "running",
                status: runningStatus
            };
        else
        return {
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
            }
        ]}

    }

    me.runRsync = function (path, extraArgs) {

        if (isRunning)
            return;

        var execCmd = "rsync -armF";

        extraArgs.forEach(function (item) {
            execCmd += " " + item;
        });

        execCmd += ' /srv/share/downloads/ ';

        execCmd += "'"+path+"'";

        runRsync();

       // window.alert(execCmd);

    }

    me.stopRsync = function () {

    };

    me.onProgressChange = function(callback){
        progressCallBack = callback;
    }

    function runRsync()
    {
        isRunning = true;

        setTimeout(function(){
            runningStatus = "Start rsync...";
            emitCallback();
        }, 10);

        for (var i=1; i<100; i+=10 )
        {
            var time = 4000 - 4000/i;

            setTimeout(function(procent){
                runningStatus = "Progress " + procent +"%...";
                emitCallback();
            }, time, i);
        }

        setTimeout(function(){
            runningStatus = "done!";
            emitCallback();
            isRunning = false;
            emitCallback();
        }, 5000);
    }

    function emitCallback()
    {
        if (progressCallBack)
            progressCallBack(
                {
                    state: isRunning?"running":"not running",
                    status: runningStatus
                });
    }

    return me;

}]);


