/**
 * Created by mlyasnikov on 03.11.2015.
 */

var myApp = angular.module('my-app');

myApp.controller('statusCtrl', ['$scope', 'rsync', 'socket', '$q', '$location',
    function ($scope, rsync, socket, $q, $location) {
        "use strict";

        $scope.isRunning = false;
        $scope.runningState = "Not running";
        $scope.rawoutput = "";

        socket.on('rsync.progress', function(data){

            console.log(".");

            $scope.runningState = data.state.file + " " + data.state.percent;


        });
        socket.on('rsync.stop', function(data){

             $scope.isRunning = false;

        });

        socket.on('rsync.rawoutput', function(data){
            $scope.rawoutput += data;
        });

        socket.on('rsync.rawstate', function(data){
            $scope.rawoutput = data;
        })

        $scope.stop = function () {
            rsync.stopRsync().then(function () {
                $scope.isRunning = false;
            }).catch(proccedError);
        };

        $scope.back = function () {
            $location.path('/setup').replace();
        };

        $scope.$on('$destroy', function (event) {
            socket.removeAllListeners();
            // or something like
            // socket.removeListener(this);
        });


        function proccedError(err) {
            $scope.canRun = false;
            window.alert(err.message);
        }

    }]);