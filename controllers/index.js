/**
 * Created by vfrc2 on 24.11.15.
 *
 * Index for web server
 *
 */
var log = require('./../helpers/logger')(module);
var logReq = require('./../helpers/logger')(module, 'request');

var express = require('express');

function createRouter(app) {

    var router = express.Router();

    var apiRoute = app.appconfig.apiRoute;

    log.debug("Using rsync on api path %s", apiRoute);

    router.use(apiRoute, require('./rsync')(app));
    router.use(apiRoute, require('./sysinfo')(app));

    if (app.appsocket) {

        app.appsocket.on('connection', function (socket) {

            logReq.debug('client connected', socket.id);


            socket.on('disconnect', function () {

                logReq.debug("client disconnected", socket.id);
            });

        });

        log.debug("Socket.io initialized");
    }

    return router;
}

module.exports = createRouter;