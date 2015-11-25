/**
 * Created by mlyasnikov on 30.10.2015.
 */

var myApp = angular.module('my-app');

myApp.controller('setupCtrl', ['$scope', 'rsync', 'socket', '$q', '$location',
    function ($scope, rsync, socket, $q, $location) {
        "use strict";


        $scope.canRun = false;

        socket.on('rsync.start',function(){
            $location.path('/status/').replace();
        });

        rsync.status()
            .then(function (result) {
                if (result.state == "running") {
                    $location.path('/status/').replace();
                    return;
                }
                rsync.sysinfo().then(initNotRunningState);
            }).catch(proccedError);

        $scope.run = function (device) {

            var extraArgs = [];

            if (device.dryRun == true)
                extraArgs.push("-n");

            if (device.extraArgs.length > 0) {
                extraArgs.push(device.extraArgs);
            }

            device.ignoreList.forEach(function (item) {
                if (item.checked == true)
                    extraArgs.push("--exclude '" + item.name + "'");
            });

            rsync.runRsync(device.mount, extraArgs)
                .then(function () {
                    $location.path('/status/').replace();
                })
                .catch(function (err) {
                    window.alert(err.message);
                });
        };

        $scope.selectChange = function (data) {
            if (data.child != undefined)
                data.child.forEach(function (ch) {
                    ch.checked = data.checked;
                    $scope.selectChange(ch);
                })
        };

        $scope.selectAll = function (value) {
            $scope.selectedDevice.ignoreList.forEach(function (item) {
                item.checked = value;
                $scope.selectChange(item);
            })
        }

        function proccedError(err) {
            $scope.canRun = false;
            window.alert(err.message);
        }

        function initNotRunningState(data) {

            $scope.canRun = data.length > 0;
            $scope.devices = data;
            $scope.devices.forEach(function (dev) {
                dev.dryRun = false;
                dev.extraArgs = "";

                var ignoreFiles = [];

                if (dev.ignoreList != undefined) {
                    dev.ignoreList.forEach(function (item) {

                        var newItem = {
                            checked: false,
                            name: item
                        }

                        ignoreFiles.push(newItem);
                    })
                }

                dev.ignoreList = ignoreFiles;

            });

            $scope.selectedDevice = $scope.devices[0];

            $scope.$on('$destroy', function (event) {
                socket.removeAllListeners();
                // or something like
                // socket.removeListener(this);
            });
        }

    }]);