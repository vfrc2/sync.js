/**
 * Created by vfrc2 on 24.11.15.
 *
 * Index for web server
 *
 */


function createRouter(io) {
    var express = require('express');
    var router = express.Router();

    router.use('/api', require('./rsync'));
    require('./socket')(io);

    return router;
}

module.exports = createRouter;