/**
 * Created by vfrc2 on 25.11.15.
 */

function createApiSocket(io) {

    var reqLogger = require('./../helpers/logger')("request");
    var logger = require('./../helpers/logger')();

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

    rsync.on('start', function (data) {
        io.emit('rsync.start', data);
    });

    rsync.on('stop', function (data) {
        io.emit('rsync.stop', data);
    })

    rsync.on('progress', function (data) {
        io.emit('rsync.progress', data);
    })

    rsync.on('rawoutput', function (data) {
        io.emit('rsync.rawoutput', data);
    })

    logger.debug("Socket.io initialized");

    /**
     * Config loger
     *
     */
    {
    //reqLogger.rewriters.push(function (lvl, msg, meta) {
    //    if (meta.socket) {
    //        meta.socket = {
    //            clientId: meta.socket.id
    //        }
    //    }
    //    return meta;
    //});
    }

}

module.exports = createApiSocket;