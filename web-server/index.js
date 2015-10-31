
module.exports = new function WebService()
{
    this.startService = function () {
        var express = require('express');
        var app = express();

        app.use(express.static('public'));
        app.use(errorLog);

        var rsync = require('../rsync-service');

        rsync.webApi('/api', app);
        var server = app.listen(3000, function(err) {
            "use strict";

            if (err != null)
                console.log("Error starting server");

            console.log("Serever start at http://%s:%s", server.address().address, server.address().port);
        });


        app.use(errorHandler);

        function errorLog(err, req, res, next){
            "use strict";
            console.log(error.message);
            next(err);
        };

        function errorHandler(err, req, res, next){
            "use strict";
            res.status(500);
            res.end();
        }

    }
};