/**
 * Created by vfrc2 on 15.12.15.
 */

myApp.factory("sysinfo", ['$http', 'socket', '$q', function ($http, socket, $q) {
    "use strict";

    this.get = function () {
        return $http.get('/api/sysinfo').then(
            function (response) {
                if (!response.data)
                    throw new Error("Api call error! Null object!");
                return response.data;
            }
        ).catch(function (err) {
            throw new Error("Api call error! " + err.data);
        });
    };

    socket.on('blockdev.newdevice', function (data) {
        _emit('newdevice', data);
    });

    var events = [];
    //on: newdevice
    this.on = function on(event, callback) {
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

    this.removeAllListeners = function () {
        events = [];
    };
    return this;

}]);