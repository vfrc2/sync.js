/**
 * Created by vfrc2 on 24.11.15.
 *
 * Index for web server
 *
 */
var log = require('./../helpers/logger')(module);
var express = require('express');

function createRouter(app) {

    var router = express.Router();

    var apiRoute = app.appconfig.webserver.apiRoute;

    log.debug("Using rsync on api path %s", apiRoute );

    router.use(apiRoute, require('./rsync')(app));
    router.use(apiRoute, require('./sysinfo')(app));

    return router;
}

module.exports = createRouter;