# sync.js v0.1.0

App with web interface to sync files to another computer with external hdd

- [Rsync](#rsync)
	- [Get rsync status](#get-rsync-status)
	


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

