/**
 * Created by mlyasnikov on 30.10.2015.
 */

var myApp = angular.module('my-app', [])
    .directive('indeterminate', function(){
    return {
        restrict: 'A',
        link: function($scope, element, attrs) {
            if (scope.$eval(attrs.indeterminate))
                element.prop("indeterminate", true)
            else
                element.prop("indeterminate", false)
        }
    }
});

myApp.controller('MainController', ['$scope', function($scope) {
    "use strict";

    $scope.devices =
        [
            {name:"Trancent 500Gb", path:"/path/download"},
            {name:"Jet Flash 4Gb", path:"/path/download2"}
        ];
    $scope.selectedDevice = $scope.devices[0];

    $scope.ignoreFiles = [
        {
            name: "Folder 1",
            state: null,
            child:
            [
                {name:"File 1", state: true},
                {name:"File 2", state: false},
                {name:"File 3", state: false},
                {
                    name:"Subfolder 1",
                    state: false,
                    child:[
                        {name:"File 1", state: false},
                        {name:"File 1", state: false}
                    ]
                }
            ]
        },
        {
            name: "Folder 1",
            state: null,
            child:
                [
                    {name:"File 1", state: false},
                    {name:"File 2", state: false},
                    {name:"File 3", state: false},
                    {
                        name:"Subfolder 1",
                        state: false,
                        child:[
                            {name:"File 1", state: false},
                            {name:"File 1", state: false}
                        ]
                    }
                ]
        }
    ];

    console.log($scope.ignoreFiles);

    $scope.run = function(){
        $scope.ignoreFiles[0].state =  !$scope.ignoreFiles[0].state;
    }

    $scope.selectChange = function ( data ) {
        if (data.child != undefined)
            data.child.forEach(function (ch) {
                ch.state = data.state;
                $scope.selectChange(ch);
            })
        };

}]);