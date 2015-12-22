/**
 * Created by mlyasnikov on 31.10.2015.
 */

var myApp = angular.module('my-app');

myApp.factory("rsync", ['$http', '$q', '$rootScope', 'socket', function ($http, $q, $rootScope, socket) {
    "use strict";

    var me = {};

    me.isRunning = false;
    me.outputBuffer = [];

    me.status = function () {

        var req = {
            method: 'GET',
            url: '/api/status',
            headers: {

            }
        };
        return $http(req).then(
            function (response) {
                if (!response.data)
                    throw new Error("Api call error! Null object!");
                return response.data;
            }
        ).catch(httpErrorHandler);
    };

    me.runRsync = function (path, args) {

        var data = {
            path: path,
            extraArgs: args
        }

        return $http.post('/api/start', data)
            .finally(function () {
                me.rsyncConfig = undefined;
                me.isRunning = false;
            }).catch(httpErrorHandler);

    };

    function httpErrorHandler(err) {
        if (err.data && err.data.error)
            return $q.reject(new Error(err.data.error));
        else
            return $q.reject(new Error("Unknow server error!"));
    }

    me.stopRsync = function () {
        return $http.post('/api/stop', null)
            .catch(httpErrorHandler);
    };

    //Event copy progress
    //
    //Fire when rsync emit progress of copied file
    //
    //WEBSOCKET rsync.progress
    //Success Response
    //
    //websocket data: {json}
    //
    //{
    //    filename: "filename.ext",
    //        size: 1000
    //    percent: 23,
    //        speed: 1200,
    //    est: "3:45 min"
    //}
    socket.on('rsync.progress', function (data) {
        console.log(".");
        _emit("progress", data);
    });

    socket.on('rsync.state', function (data) {
        _emit("state", data);
    });

    socket.on('rsync.rawoutput', function (data) {
        me.outputBuffer.push(data);
        _emit("rawoutput", data);
    });

    socket.on('rsync.rawstate', function (data) {
        me.outputBuffer = data;
    });

    var events = [];
    //on: progress, start, stop, rawoutput
    me.on = function on(event, callback) {
        if (!events[event])
            events[event] = [];
        events[event].push(callback);
    };

    function _emit(event, data) {
        if (events[event]) {
            events[event].forEach(function (callback) {

                callback(data);
            })
        }
    }

    me.removeAllListeners = function () {
        events = [];
    };

    return me;

}]);


