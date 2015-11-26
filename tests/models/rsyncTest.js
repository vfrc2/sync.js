/**
 * Created by vfrc2 on 25.11.15.
 */

describe('Running rsync with cat of real', function () {

    it('shouldrun', function (done) {
        var rsyncCmd = {
            prog: "cat",
            args: [
                __dirname + "/copy-log.log"
            ]
        };

        run(rsyncCmd, done);

    });

    it('shouldrun with -n', function (done) {
        var rsyncCmd = {
            prog: "cat",
            args: [
                __dirname + "/copy-log-n.log"
            ]
        };

        run(rsyncCmd, done);

    });

    var Rsync = require("./../../models/rsync").create;

    function run(rsyncCmd, done){
        var rsync = new Rsync();

        rsync._setCmd(rsyncCmd);

        rsync.on('progress', function(data){
            console.log(data);
        });

        rsync.on('file', function(data){
            console.log(data);
        });

        rsync.on('rawoutput', function(data){
            console.log(data);
        });

        var p = rsync.start({path: "blablabal"});

        p.then(function (res) {

            console.log("Exitcode: " + res);
            rsync.getBuffer();
            done();

        }).done();
    }
});