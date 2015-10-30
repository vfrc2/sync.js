//Module to exec rsync command and listen output

var spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;

// run rsync
// 
// doSync(config, function(err, result))
//

function CreateRsyncService()
{
    var curentRunning = null;
    
    var child = null;
    
    var service = {
        
        doSync: function(config, callback) {
            
            if (child != null)
                callback(new Error("Already running!"));
            
            child = spawn('rsync');
                        
            
            child.on('exit', function(exitCode) {
                if (exitCode > 0)
                    callback(new Error('Bad exit code: ' + exitCode));
                
               callback(null); 
            });
        }
    }
    
    util.inherits(service, EventEmitter);
    
}



module.exports = CreateRsyncService();





