/**
 * Created by mlyasnikov on 30.10.2015.
 */

var myApp = angular.module('my-app');

myApp.controller('setupCtrl', ['$scope', 'sysinfo', 'rsync', '$q', '$location', 'toastr',
    function ($scope, sysinfo, rsync, $q, $location, toastr) {
        "use strict";

        start();

        $scope.run = function (device) {

            var extraArgs = [];

            if (device.dryRun == true)
                extraArgs.push("-n");

            if (device.extraArgs.length > 0) {
                extraArgs.push(device.extraArgs);
            }

            device.ignoreList.forEach(checkItem);

            function checkItem(item) {

                if (item.checked == true)
                    extraArgs.push("--exclude '" + item.name + "'");

                if (item.childs && item.childs.length > 0)
                    item.childs.forEach(checkItem);
            }

            rsync.runRsync(device.mount, extraArgs)
                .then(function () {
                    $location.path('/status');
                })
                .catch(
                    function (err) {
                        toastr.error(err.message);
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
            if (err.message !== "Rsync already running!")
                toastr.error(err.message);
        }

        function start(){
            $scope.viewLoading = true;

            rsync.status()
                .then(function (status) {

                    if (status.isRunning) {
                        $location.path('/status');
                        throw new Error("Rsync already running!");
                    }

                    return sysinfo.get();
                })
                .then(function (results) {
                    initView(results);
                })
                .catch(proccedError)
                .finally(function(){
                    $scope.viewLoading = false;
                });

        }

        function initView(data) {

            $scope.devices = data.devices;

            if (data.warning && data.warning.length > 0)
                data.warning.forEach(function (war) {
                    toastr.warning(war);
                });


            $scope.devices.forEach(function (dev) {
                dev.dryRun = false;
                dev.extraArgs = "";
                dev.canRun = true;

                var ignoreFiles = [];

                if (dev.ignoreList != undefined) {

                    dev.ignoreList.forEach(function (item) {
                        var newItem = {
                            checked: false,
                            name: item.filename,
                            //childs: []
                        }

                        ignoreFiles.push(newItem);
                    });
                }

                dev.ignoreList = ignoreFiles;

            });

            $scope.selectedDevice = $scope.devices[0];


        }

        sysinfo.on('newdevice', function(){
            toastr.info("New device!");
        });

        $scope.$on('$destroy', function (event) {
            // WARNING
            // this staf remove ALL listeners! => can't be
            // used when 2 or more controllers active in same time
            rsync.removeAllListeners();
            sysinfo.removeAllListeners();
        });

    }]);