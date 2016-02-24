/**
 * Created by vfrc2 on 24.11.15.
 */

var proc = require('child_process');
var Promise = require('promise');

function spawn(prog, args, options) {

    var stderrBuffer = "";

    if (!options)
        options = {
        };

    return new Promise(function (resolve, reject) {

        var child = proc.spawn(prog, args);
        child.err = null;

        child.on('error', function (err) {
            child.err = err;
        });

        child.stderr.on('data', function (data) {
            stderrBuffer += data;
        });

        //child.stdout.on('data', function (data) {
        //    stderrBuffer += data;
        //});

        var stdout =  child.stdout;
        var stderr =  child.stderr;
        if (options.pipe)
            stdout = stdout.pipe(options.pipe);
        if (options.pipeErr)
            stderr = stderr.pipe(options.pipeErr);

        resolve({
            child: child,
            stdout: stdout,
            stderr: stderr,
            done: new Promise(function(resolve, reject){
                child.on('close', function (exitcode) {
                    if (child.err)
                        reject(child.err);

                    if (exitcode != 0) {
                        reject(new Error(stderrBuffer));
                        return;
                    }

                    resolve(exitcode);
                });
            })
        });
    });
}

module.exports.spawn = spawn;

