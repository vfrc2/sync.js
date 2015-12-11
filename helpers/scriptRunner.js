/**
 * Created by vfrc2 on 24.11.15.
 */

var proc = require('child_process');
var Promise = require('promise');

function spawn(prog, args, options) {

    var stderrBuffer = "";

    if (!options)
        options = {
        }

    var p = new Promise(function (resolve, reject) {

        var child = proc.spawn(prog, args);
        child.err = null;

        child.on('error', function (err) {
            child.err = err;
        });

        child.stderr.on('data', function (data) {
            stderrBuffer += data;
        });

        child.stdout.on('data', function (data) {
            stderrBuffer += data;
        });

        var stdout =  child.stdout;
        if (options.pipe)
            stdout = stdout.pipe(options.pipe);

        resolve({
            child: child,
            stdout: stdout,
            done: new Promise(function(resolve, reject){
                child.on('close', function (exitcode) {
                    if (child.err)
                        reject(child.err);

                    if (exitcode != 0) {
                        reject(new Error("Error (" + exitcode + ") "
                            + prog  + " \n" + stderrBuffer));
                        return;
                    }

                    resolve(exitcode);
                });
            })
        });
    });

    return p;
}

module.exports.spawn = spawn;

