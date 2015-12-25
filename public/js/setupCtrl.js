/**
 * Created by mlyasnikov on 30.10.2015.
 */

var myApp = angular.module('my-app');

myApp.controller('setupCtrl', ['$scope', 'sysinfo', 'rsync', '$q', '$location', 'toastr',
    function ($scope, sysinfo, rsync, $q, $location, toastr) {
        "use strict";

        $scope.devices = [];

        start();

        $scope.run = function (device) {

            var extraArgs = [];

            if (device.dryRun == true)
                extraArgs.push("-n");

            if (device.extraArgs.length > 0) {
                extraArgs.push(device.extraArgs);
            }

            var files = getLeafs(device.ignoreFiles);
            files.forEach(checkItem);

            function checkItem(item) {

                if (item.checked == true)
                    extraArgs.push("--exclude=" + item.fileItem.filename);

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
            if (data.childs != undefined)
                data.childs.forEach(function (ch) {
                    ch.checked = data.checked;
                    $scope.selectChange(ch);
                })
        };

        $scope.selectAll = function (value) {
            $scope.selectedDevice.ignoreFiles.forEach(function (item) {
                item.checked = value;
                $scope.selectChange(item);
            })
        };

        function proccedError(err) {
            $scope.canRun = false;
            if (err.message !== "Rsync already running!")
                toastr.error(err.message);
        }

        function start(checkNew) {
            $scope.viewLoading = true;

            rsync.status()
                .then(function (status) {

                    if (status.isRunning) {
                        $location.path('/status');
                        throw new Error("Rsync already running!");
                    }

                    return sysinfo.getSysInfo();
                })
                .then(function (results) {
                    if (checkNew)
                        checkNewDevices(results.devices);
                    initView(results);
                })
                .catch(proccedError)
                .finally(function () {
                    $scope.viewLoading = false;
                });

        }

        function initView(data) {

            if (data.warning && data.warning.length > 0)
                data.warning.forEach(function (war) {
                    toastr.warning(war);
                });


            $scope.devices.forEach(function(dev){
                if (data.devices.filter(function(dev2){
                        return dev.serial === dev2.serial;
                    }).length < 1){

                    toastr.warning("Device " + dev.model + " was disconected!");
                    dev.canRun = false;
                    if (!dev.warning || !dev.warning.push)
                        dev.warning = [];
                    dev.warning.push("Disconected");

                }
            });

            data.devices.forEach(function (dev) {

                var scopeDev = findDevice(dev.serial);

                if (!scopeDev) {
                    scopeDev = dev;
                    scopeDev.dryRun = false;
                    scopeDev.extraArgs = "";
                    scopeDev.canRun = true;

                    var ignoreFiles = [];

                    if (dev.ignoreFiles != undefined) {

                        dev.ignoreFiles = getTree(dev.ignoreFiles);
                    } else
                        dev.ignoreFiles = [];

                    $scope.devices.push(scopeDev);
                }

                scopeDev.canRun = true;
                scopeDev.warning = dev.warning;



            });

            if (!$scope.selectedDevice) {
                $scope.selectedDevice = $scope.devices[0];
            }
        }

        function findDevice(serial) {

            for (var dev in $scope.devices) {
                if ($scope.devices[dev].serial === serial)
                    return $scope.devices[dev];
            }

            return undefined;
        }

        function checkNewDevices(devices){

            devices.forEach(function(dev){

                if (!findDevice(dev.serial))
                    toastr.info("Device " + dev.model + " conected!")

            })

        }

        sysinfo.on('newdevice', function () {
            start(true);
        });

        $scope.$on('$destroy', function (event) {
            // WARNING
            // this staf remove ALL listeners! => can't be
            // used when 2 or more controllers active in same time
            rsync.removeAllListeners();
            sysinfo.removeAllListeners();
        });

        function getTree(files) {

            var root = {childs: []};

            if (files.forEach) {
                files.forEach(function (file) {

                    var path = file.filename.split('/');

                    var curRoot = root;

                    for (var i in path) {
                        if (i == path.length - 1) {
                            curRoot.childs.push({
                                name: path[i],
                                fileItem: file
                            });
                            break;
                        }

                        var nextRoot = find(curRoot, path[i]);

                        if (!nextRoot) {
                            nextRoot = {name: path[i], childs: []};
                            curRoot.childs.push(nextRoot);
                        }
                        curRoot = nextRoot;
                    }

                    function find(root, item) {

                        for (var i in root.childs)
                            if (root.childs[i].name == item)
                                return root.childs[i];

                        return undefined;
                    }

                });
            }

            return root.childs;

        }

        function getLeafs(tree) {

            if (!tree.childs) {
                if (tree.forEach) {
                    var leafs = [];
                    tree.forEach(function (item) {
                        leafs = leafs.concat(getLeafs(item));
                    });
                    return leafs;
                }
                else
                    return tree;
            }

            var leafs = [];

            tree.childs.forEach(function (item) {
                leafs = leafs.concat(getLeafs(item));
            });

            return leafs;

        }

    }]);