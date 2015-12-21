/**
 * Created by vfrc2 on 25.11.15.
 */

function CreateApiSocket(app) {

    var reqLogger = require('./../helpers/logger')(module, "request");
    var logger = require('./../helpers/logger')(module);

    var io = app.appsocket;

    io.on('connection', function (socket) {

        reqLogger.debug('client connected', socket.id);

        if (rsync.isRunning()) {
            io.emit('rsync.rawstate', rsync.getBuffer());
        }

        socket.on('disconnect', function () {

            reqLogger.debug("client disconected", socket.id);
        });

    });

    logger.debug("Socket.io initialized");
}

module.exports = CreateApiSocket;