/**
 * Created by mlyasnikov on 31.10.2015.
 */

var myApp = angular.module('my-app');

myApp.factory("rsync", ['$http', '$q', function($http, $q) {
    "use strict";

    var me = {};

    me.isRunning = false;

    me.status = function() {

        return $http.get('/api/status').then(
            function(response){
                if (!response.data)
                    throw new Error("Api call error! Null object!");
                return response.data;
            }
        ).catch(function(err)
            {
                throw new Error("Api call error! " + err.data);
            });

    };

    me.sysinfo = function() {
        return $http.get('/api/sysinfo').then(
            function(response){
                if (!response.data)
                    throw new Error("Api call error! Null object!");
                return response.data;
            }
        ).catch(function(err)
            {
                throw new Error("Api call error! " + err.data);
            });
    };


    me.runRsync = function (path, args) {

        var data = {
            path: path,
            extraArgs: args
        }

        return $http.post('/api/start', me.rsyncConfig)
            .catch(function(err){
                throw new Error("Api call eror! " + err.data);
            }).finally(function(){
                me.rsyncConfig = undefined;
                me.isRunning = false;
            });

    };

    me.stopRsync = function () {
        return $http.post('/api/stop', null)
            .catch(function(err){
                throw new Error("Api call eror! " + err.data);
            });
    };

    return me;

}]);


