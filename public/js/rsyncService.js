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

        return $http.get('/api/status').then(
            function (response) {
                if (!response.data)
                    throw new Error("Api call error! Null object!");
                return response.data;
            }
        ).catch(function (err) {
            throw new Error("Api call error! " + err.data);
        });

    };

    me.runRsync = function (path, args) {

        var data = {
            path: path,
            extraArgs: args
        }

        return $http.post('/api/start', data)
            .catch(function (err) {
                throw new Error("Api call eror! " + err.data);
            }).finally(function () {
                me.rsyncConfig = undefined;
                me.isRunning = false;
            });

    };

    me.stopRsync = function () {
        return $http.post('/api/stop', null)
            .catch(function (err) {
                throw new Error("Api call eror! " + err.data);
            });
    };

    socket.on('rsync.progress', function (data) {
        console.log(".");
        _emit("progress", data);
    });

    socket.on('rsync.stop', function (data) {
        me.isRunning = false;
        _emit("stop");
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


