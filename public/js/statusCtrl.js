/**
 * Created by mlyasnikov on 03.11.2015.
 */

var myApp = angular.module('my-app');

myApp.controller('statusCtrl', ['$scope', 'results', 'rsync','$q', '$location', 'toastr',
    function ($scope, results, rsync, $q, $location, toastr) {
        "use strict";

        if (!results.isResults) {
            $location.url('/');
            $location.replace();
            return;
        }

        $scope.isRunning = false;
        $scope.runningState =  {status:"Not running"};
        $scope.rawoutput = "";

        $scope.$watch(function() {return results.isRunning}, function(newValue, oldValue){
            $scope.isRunning = newValue;
        });

        $scope.$watch(function() {return results.progress},  function(newValue){
            $scope.runningState = newValue;
        });

        $scope.$watch(function() {return results.resultBufferStr}, function(newValue){
            $scope.rawoutput = newValue;
        });

        $scope.stop = function () {
            rsync.stopRsync().then(function () {
                results.isRunning = false;
            }).catch(proccedError);
        };

        $scope.back = function () {
            results.goFromStatusToSetup();
        };

        if (!results.isRunning) {
            rsync.runRsync(results.rsyncConfig.path,
                results.rsyncConfig.extraArgs)
                .then(function(){
                    results.isRunning = true;
                })
                .catch(
                function (err) {
                    toastr.error(err.message);
                });
        }

        function proccedError(err) {

            toastr.error(err.message);
        }

    }]);