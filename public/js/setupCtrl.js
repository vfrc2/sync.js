/**
 * Created by mlyasnikov on 30.10.2015.
 */

var myApp = angular.module('my-app');

myApp.controller('setupCtrl', ['$scope', 'results', 'rsync', 'socket', '$q', '$location', 'toastr',
    function ($scope, results, rsync, socket, $q, $location, toastr) {
        "use strict";

        if (results.isRunning) {
            $location.path('/status/').replace();
            return;
        }

        rsync.sysinfo().then(function (results) {

            if (results.warning && results.warning.length > 0);
            results.warning.forEach(function (warn) {
                toastr.warning(warn);
            });

            initView(results);

        }).catch(proccedError);

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

            results.goFromSetupToStatus({
                path: device.mount,
                extraArgs: extraArgs
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
            toastr.error(err.message);
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

            //$scope.$on('$destroy', function (event) {
            //    socket.removeAllListeners();
            //    // or something like
            //    // socket.removeListener(this);
            //});
        }

    }]);