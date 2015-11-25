/**
 * Created by vfrc2 on 25.11.15.
 */
var myApp = angular.module('my-app');

myApp.factory("socket", ['$q','$rootScope', function($q, $rootScope) {
    "use strict";
    var socket = io.connect();

    return {

        on: function(event, callback){
            socket.on(event, function(data){
                var args = data;
                $rootScope.$apply(function(){
                    callback(args);
                });
            });
        },

        removeAllListeners:function(){
            socket.removeAllListeners();
        }
    }

}]);