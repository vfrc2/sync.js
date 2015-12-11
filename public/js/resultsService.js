/**
 * Created by vfrc2 on 09.12.15.
 */

var myApp = angular.module('my-app');

myApp.factory("results", ['$http', '$q', 'rsync', 'socket', '$location',
    function ($http, $q, rsync, socket, $location) {
        "use strict";

        var me = this;

        this.isResults = false; //true then rsync already finished
        this.isRunning = false; //true wile rsync runs

        this.resultBuffer = [];
        me.resultBufferStr = "";
        this.progress = {status: "Not running", percent: 0};


        this.rsyncConfig = {
            path: "bad path",
            extraArgs: "badArgs"
        };

        this.goFromSetupToStatus = function (config) {
            this.isResults = true;
            rsync.rsyncConfig = config;
            $location.path('/status');
        };

        this.goFromStatusToSetup = function () {

            this.isRunning = false;
            this.isResults = false;

            this.resultBuffer = [];
            me.resultBufferStr = "";

            this.rsyncConfig = {
                path: "bad path",
                extraArgs: "badArgs"
            };

            $location.path('/setup');

        };

        socket.on('rsync.progress', function (data) {

            console.log(".");
            me.progress = { status: "Coping " + data.filename,
                percent: data.percent &&
                    data.percent >= 0 &&
                    data.percent <= 100 ?
                    data.percent: 100};
        });

        socket.on('rsync.stop', function (data) {
            me.isRunning = false;
            me.progress = { status: "Rsync complete"}
        });

        socket.on('rsync.rawoutput', function (data) {
            me.resultBuffer.push(data);
            me.resultBufferStr += data + "\n";
        });

        socket.on('rsync.rawstate', function (data) {
            //$scope.rawoutput = data;
        })

        return this;

    }]);