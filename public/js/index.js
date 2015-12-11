/**
 * Created by mlyasnikov on 03.11.2015.
 */

var mainApp = angular.module("my-app", ['ngRoute','toastr']);

mainApp.filter('bytes', function() {
    return function(bytes, precision) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
        if (typeof precision === 'undefined') precision = 1;
        var units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'],
            number = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
    }
});

mainApp.config(['$routeProvider', function($routeProvider){
    "use strict";

    $routeProvider
        .when('/setup', {
            templateUrl: 'js/views/setup.html',
            controller: 'setupCtrl'
        })
        .when('/status', {
            templateUrl: 'js/views/running.html',
            controller: 'statusCtrl'
        })
        .otherwise({
            redirectTo: '/setup'
        });
}]);