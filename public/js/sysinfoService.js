/**
 * Created by vfrc2 on 15.12.15.
 */

myApp.factory("sysinfo", ['$http', '$q', function ($http, $q) {
    "use strict";

    this.get = function () {


        return $http.get(
            '/api/sysinfo',
            {
                headers:{'cache-control': 'private, max-age = 3600'}
            })
            .then(
                function (response) {
                    if (!response.data)
                        throw new Error("Api call error! Null object!");
                    return response.data;
                }
            ).catch(function (err) {
                throw new Error("Api call error! " + err.data);
            });
    };

    return this;

}]);