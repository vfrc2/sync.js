
module.exports = new function WebService()
{
    this.startService = function () {
        var express = require('express');
        var app = express();

        app.use(express.static('public'));

        var rsync = require('../rsync-service');

        rsync.webApi('/api', app);
        var server = app.listen(3000, function(err) {
            "use strict";

            if (err != null)
                console.log("Error starting server");

            console.log("Serever start at http://%s:%s", server.address().address, server.address().port);
        });
    }
};