# sync.js v0.1.0

App with web interface to sync files to another computer with external hdd

- [Rsync](#rsync)
	- [Get rsync status](#get-rsync-status)
	- [Start rsync](#start-rsync)
	- [Stop running rsync](#stop-running-rsync)
	
- [Sysinfo](#sysinfo)
	- [Get ext hdd info](#get-ext-hdd-info)
	
- [Websocket_Rsync](#websocket_rsync)
	- [Event copy progress](#event-copy-progress)
	- [Event new output line](#event-new-output-line)
	- [Event on change rsync process state](#event-on-change-rsync-process-state)
	


# Rsync

## Get rsync status

<p>Get status of running rsync instance</p>

	GET /status


### Success Response

Success-Response:

```
HTTP/1.1 200 OK
{
  "isRunnig": true,
  "isFinished": false,
  "outputBuffer": [
     ...
     "file.xsl",
     ...
    ]
}
```
### Error Response

Error-Response:

```
HTTP/1.1 500 Internal Server Error
{
  "error": "message"
}
```
## Start rsync

<p>Start rsync process</p>

	POST /start


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| path			| string			|  <p>Path to external hdd</p>							|
| extraArgs			| string[]			|  <p>Extra args for rsync</p>							|

### Error Response

Error-Response:

```
HTTP/1.1 500 Internal Server Error
{
  "error": "message"
}
```
## Stop running rsync

<p>Request to stop running rsync</p>

	POST /stop


### Error Response

Error-Response:

```
HTTP/1.1 500 Internal Server Error
{
  "error": "message"
}
```
# Sysinfo

## Get ext hdd info

<p>Get drives mounted to /media and stat info about each</p>

	GET /sysinfo


### Success Response

HTTP-1/1 200:

```
[
 {
     "dev":"/dev/sdc1",
     "mount":"/media/vfrc2/Transcend",
     "used":19655368704,
     "available":12456087552,
     "size":32111456256,
     "model":"Transcend 32GB",
     "ignoreList":[]
 }
]
```
### Error Response

Error-Response:

```
HTTP/1.1 500 Internal Server Error
{
  "error": "message"
}
```
# Websocket_Rsync

## Event copy progress

<p>Fire when rsync emit progress of copied file</p>

	WEBSOCKET rsync.progress


### Success Response

websocket data: {json}

```
{
          filename: "filename.ext",
          size: 1000
          percent: 23,
          speed: 1200,
          est: "3:45 min"
        }
```
## Event new output line

<p>Fire when rsync emit new output line</p>

	WEBSOCKET rsync.rawoutput


## Event on change rsync process state

<p>Fire when rsync starts or stops and when change state</p>

	WEBSOCKET rsync.state


### Success Response

{

```
{
     title: "Rsync start"
     type: "start"
}
```

