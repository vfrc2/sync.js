/**
 * Created by vfrc2 on 25.11.15.
 */

function createApiSocket(io) {

    var reqLogger = require('./../helpers/logger')(module, "request");
    var logger = require('./../helpers/logger')(module);

    var rsync = require('./../models/rsyncService');

    io.on('connection', function (socket) {

        reqLogger.debug('client connected', socket.id);

        if (rsync.isRunning()) {
            io.emit('rsync.rawstate', rsync.getBuffer());
        }

        socket.on('disconnect', function () {

            reqLogger.debug("client disconected", socket.id);
        });

    });

    /**
     * @api {websocket} rsync.start Event start
     * @apiGroup Websocket Rsync
     * @apiDescription
     * Fire when rsync starts
     */
    rsync.on('start', function (data) {
        io.emit('rsync.start', data);
    });

    /**
     * @api {websocket} rsync.stop Event stop
     * @apiGroup Websocket Rsync
     * @apiDescription
     * Fire when rsync finished or killed
     */
    rsync.on('stop', function (data) {
        io.emit('rsync.stop', data);
    })

    /**
     * @api {websocket} rsync.progress Event copy progress
     * @apiGroup Websocket Rsync
     * @apiDescription
     * Fire when rsync emit progress of copied file
     * @apiSuccess {string}  filename    Name of curently coping file
     * @apiSuccess {int}     size        file size (bytes)
     * @apiSuccess {int}     percent     int 0..100
     * @apiSuccess {int}     speed       int (bits/s)
     * @apiSuccess {string}  est         est time
     * @apiSuccessExample websocket data: {json}
     * {
          filename: "filename.ext",
          size: 1000
          percent: 23,
          speed: 1200,
          est: "3:45 min"
        }
     */
    rsync.on('progress', function (data) {
        io.emit('rsync.progress', data);
    })

    /**
     * @api {websocket} rsync.rawoutput Event new output line
     * @apiGroup Websocket Rsync
     * @apiDescription
     * Fire when rsync emit new output line
     * @apiSuccess {string} line New output line
     */
    rsync.on('rawoutput', function (data) {
        io.emit('rsync.rawoutput', data);
    });

    logger.debug("Socket.io initialized");

}

module.exports = createApiSocket;