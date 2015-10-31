// Need to run rsync command, if no runnig daemon when simply start rsync job
// else delegate it to runnig daemon
//
// if rsync called with --daemon
//   check if no daemon already running, then
//   save pid, rpc port number to /var/run/<name> from config or args
//   eles exit with error
//
// if running without --daemon
//   check if daemon already running, then
//      simply parse args to tcp requst
//   else
//      directly start rsync command with givin args
//
//  Cmd args:
//  
//    run as client or just runner with out web interface:
//   
//      sync [-p <port>] [--stop|--status] [<hdd-path>] [<dop args>]
//
//    run as web interface daemon:
//  
//      sync [-p <port>] [-c <conf>] -d
//
//
//    --daemon, -d - daemon mode start web interface
//    
//    --pid, -p <pid-file> - pid of server
//    --conf, -c <conf-file> - config file for sync (default /etc/<pname>; /home/<user>/.pname)
//    
//    --status - get status of sync from daemon
//    --stop   - stop syncing
//    
//    <hdd-path> - path to remote drive where to tmp sync file
//    <dop rsync args> - any rsync args pass throw to rsync
//      
//    config template:
//        daemon:
//          pid: /var/run/sync.pid
//        
//        rsync:
//          path: /usr/lib/....
//          args: "-avrhm --progress -F"
//        
//        target:
//          from: /srv/share/downloads
//          remote: server.pyt.lan:share/videos
//

var webService = require('./web-server');
webService.startService();
