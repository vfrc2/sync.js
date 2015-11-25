/**
 * Created by vfrc2 on 25.11.15.
 */

function createApiSocket(io){

    var rsync = require('./../models/rsync');

    io.on('connection', function (socket) {

        console.log('client connected');

        if (rsync.isRunning()){
            io.emit('rsync.rawstate', rsync.getBuffer());
        }

        socket.on('disconnect', function(){
            //sockets.remove(index);
            console.log("client disconected");
        });

    });



    rsync.on('start', function(data){
        io.emit('rsync.start', data);
    });

    rsync.on('stop', function (data) {
        io.emit('rsync.stop', data);
    })

    rsync.on('progress',function(data){
        io.emit('rsync.progress', data);
    })

    rsync.on('rawoutput', function(data){
        io.emit('rsync.rawoutput',data);
    })

}

module.exports = createApiSocket;