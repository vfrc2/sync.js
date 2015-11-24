/**
 * Created by vfrc2 on 24.11.15.
 */

var proc = require('child_process');
var ssplt = require("stream-splitter");
var Promise = require('promise');


function spawn(prog, args, option) {

    var stderrBuffer = "";

    var p = new Promise(function (resolve, reject) {

        var child = proc.spawn(prog, args);

        child.on('error', function (err) {
            reject(err);
        });

        child.stderr.on('data', function (data) {
            stderrBuffer += data;
        });

        var stdout = child.stdout.pipe(ssplt('\n'));

        resolve({
            child: child,
            stdout: stdout,
            done: new Promise(function(resolve, reject){
                child.on('close', function (exitcode) {
                    if (exitcode != 0) {
                        reject(new Error("Error execute " + prog + " " + args + " :\n" + stderrBuffer));
                    }
                    resolve(exitcode);
                });
            })
        });
    });

    return p;
}

module.exports.spawn = spawn;

