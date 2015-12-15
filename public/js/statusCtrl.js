/**
 * Created by mlyasnikov on 03.11.2015.
 */

var myApp = angular.module('my-app');

myApp.controller('statusCtrl', ['$scope', 'rsync','$q', '$location', 'toastr',
    function ($scope, rsync, $q, $location, toastr) {
        "use strict";

        $scope.isRunning = false;
        $scope.runningState =  {status:"Not running"};
        $scope.rawoutput = "";

        rsync.status().then(function(status){
            if (!status.isRunning && !status.isFinished) {
                $location.path('/').replace();
                return;
            }

            $scope.isRunning = status.isRunning;

            if (status.isFinished)
                $scope.runningState = {status:"Rsync finished"};
            else (status.isRunning)
                $scope.runningState = {status:"Rsync running"};

            if (status.outputBuffer)
                $scope.rawoutput = status.outputBuffer.join('\n');

        });

        rsync.on('progress', function(data){
           $scope.runningState = {
               status: data.state.file,
               percent: data.state.percent >= 0 && data.percent <= 100?  data.percent: 100
           }
        });

        rsync.on('rawoutput', function(data){
           $scope.rawoutput += data +'\n';
        });

        rsync.on('stop', function(){
            $scope.runningState = {status:"Rsync finished"}
        });

        $scope.stop = function () {
            rsync.stopRsync().then(function () {
                $scope.back();
            }).catch(proccedError);
        };

        $scope.back = function () {
            $location.path('/setup');
        };

        function proccedError(err) {

            toastr.error(err.message);
        }

    }]);