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
            else if (status.isRunning)
                $scope.runningState = {status:"Rsync running"};

            if (status.outputBuffer)
                $scope.rawoutput = status.outputBuffer.join('\n');

        });

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
        rsync.on('progress', function(data){
           $scope.runningState = {
               status: data.filename,
               percent: data.percent >= 0 && data.percent <= 100?  data.percent: 100
           }
        });

        rsync.on('rawoutput', function(data){
           $scope.rawoutput += data +'\n';
        });

        rsync.on('state', function(data){
            $scope.runningState = {status: data.title };
            if (data.type &&
                (data.type === 'stop' || data.type==='crash'))
                $scope.isRunning = false;
        });

        $scope.stop = function () {
            rsync.stopRsync().catch(proccedError);
        };

        $scope.back = function () {
            $location.path('/setup');
        };

        function proccedError(err) {

            toastr.error(err.message);
        }

    }]);