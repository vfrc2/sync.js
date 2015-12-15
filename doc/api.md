## Members

<dl>
<dt><a href="#log">log</a></dt>
<dd><p>Created by vfrc2 on 24.11.15.</p>
<p>Index for web server</p>
</dd>
<dt><a href="#log">log</a></dt>
<dd><p>Api for starting, stoping and watch Rsync progress
Api accept json objects and answers with json</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#Get status of Rsync
url api/status">Get status of Rsync
url api/status()</a> ⇒ <code>object</code></dt>
<dd></dd>
<dt><a href="#Start rsync run
url api/start">Start rsync run
url api/start(body)</a> ⇒ <code>object</code></dt>
<dd></dd>
<dt><a href="#Get drives mounted to /media and stat info about each
url api/sysinfo">Get drives mounted to /media and stat info about each
url api/sysinfo()</a> ⇒ <code>array</code></dt>
<dd></dd>
<dt><a href="#createApiSocket">createApiSocket()</a></dt>
<dd><p>Created by vfrc2 on 25.11.15.</p>
</dd>
</dl>

<a name="log"></a>
## log
Created by vfrc2 on 24.11.15.

Index for web server

**Kind**: global variable  
<a name="log"></a>
## log
Api for starting, stoping and watch Rsync progress
Api accept json objects and answers with json

**Kind**: global variable  
**Author:** Maxim Lyasnikov (vfrc29@gmail.com)  
<a name="Get status of Rsync
url api/status"></a>
## Get status of Rsync
url api/status() ⇒ <code>object</code>
**Kind**: global function  
**Returns**: <code>object</code> - Return json object:
     {
         isRunning - means what rsync is run in progree
         isFinished - means what rsync is runed and finished
         outputBuffer - output of last rsync run, if no run when will be []
     }  
<a name="Start rsync run
url api/start"></a>
## Start rsync run
url api/start(body) ⇒ <code>object</code>
**Kind**: global function  
**Returns**: <code>object</code> - HTTP OK or 500 if error
if error is RsyncError when it will return 
     {
         {string} error: error message
     }  

| Param | Type | Description |
| --- | --- | --- |
| body | <code>object</code> | need to be json object      {          {string} path - full path where to copy file (ext hdd path)          {array} extraArgs - extra args for rsync      } |

<a name="Get drives mounted to /media and stat info about each
url api/sysinfo"></a>
## Get drives mounted to /media and stat info about each
url api/sysinfo() ⇒ <code>array</code>
**Kind**: global function  
<a name="createApiSocket"></a>
## createApiSocket()
Created by vfrc2 on 25.11.15.

**Kind**: global function  
