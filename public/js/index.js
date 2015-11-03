/**
 * Created by mlyasnikov on 03.11.2015.
 */

var mainApp = angular.module("my-app", ['ngRoute']);

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