/**
 * Created by vfrc2 on 25.11.15.
 */

describe('Running rsync with cat of real', function () {

    it('shouldrun', function (done) {
        var rsyncCmd = {
            prog: "cat",
            args: [
                __dirname + "/sync-to-hdd.log"
            ]
        };

        var rsync = require("./../../models/rsync");

        rsync._setCmd(rsyncCmd);

        var p = rsync.start({path: "blablabal"}, function (file, perc) {
            console.log("File: " + file + " " +perc)
        });

        p.then(function (res) {

            console.log("Exitcode: " + res);
            rsync.getBuffer();
            done();

        }).done();
    });
});