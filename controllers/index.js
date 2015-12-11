/**
 * Created by vfrc2 on 24.11.15.
 *
 * Index for web server
 *
 */
var log = require('./../helpers/logger')("webapp-controllers");

function createRouter(app) {
    var express = require('express');
    var router = express.Router();

    log.log("verbose","Using rsync on api path %s", app.appconfig.webserver.apiRoute );
    router.use(app.appconfig.webserver.apiRoute, require('./rsync'));
    log.log('verbose','Using socket.io');
    require('./socket')(app.appio);

    return router;
}

module.exports = createRouter;