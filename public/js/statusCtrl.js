/**
 * Created by mlyasnikov on 03.11.2015.
 */

var myApp = angular.module('my-app');

myApp.controller('statusCtrl', ['$scope','rsync','$q','$location', function($scope, rsync, $q, $location) {
    "use strict";

    $scope.isRunning = false;
    $scope.runningState = "Not running";

    rsync.status()
        .then(function(result)
        {
            if (result.state == "running") {
                $scope.isRunning = true;
                $scope.runningState = result.status;
            }
        }).catch(proccedError);

    $scope.stop = function(){
        rsync.stop().then(function(){
            $scope.isRunning = false;
        }).catch(proccedError);
    };

    $scope.back = function(){
        $location.path('/setup').replace();
    };

    function proccedError(err){
        $scope.canRun = false;
        window.alert(err.message);
    }

}]);