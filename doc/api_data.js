define({ "api": [
  {
    "type": "get",
    "url": "/status",
    "title": "Get rsync status",
    "name": "GetStatus",
    "group": "Rsync",
    "description": "<p>Get status of running rsync instance</p>",
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "Boolean",
            "optional": false,
            "field": "isRunnig",
            "description": "<p>Is Rsync instance running</p>"
          },
          {
            "group": "200",
            "type": "Boolean",
            "optional": false,
            "field": "isFinished",
            "description": "<p>Is Rsync already finished</p>"
          },
          {
            "group": "200",
            "type": "String[]",
            "optional": false,
            "field": "outputBuffer",
            "description": "<p>Output of rsync stdout and stderr</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"isRunnig\": true,\n  \"isFinished\": false,\n  \"outputBuffer\": [\n     ...\n     \"file.xsl\",\n     ...\n    ]\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "controllers/rsync.js",
    "groupTitle": "Rsync",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Rsync",
            "description": "<p>Error 500</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"error\": \"message\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/sysinfo",
    "title": "Get ext hdd info",
    "name": "GetSysinfo",
    "group": "Rsync",
    "description": "<p>Get drives mounted to /media and stat info about each</p>",
    "success": {
      "fields": {
        "root": [
          {
            "group": "root",
            "type": "Object[]",
            "optional": false,
            "field": "devices",
            "description": "<p>List of connected devices may be []</p>"
          },
          {
            "group": "root",
            "type": "String[]",
            "optional": false,
            "field": "warnings",
            "description": "<p>List of non-critical errors while getting devices info</p>"
          }
        ],
        "devices": [
          {
            "group": "devices",
            "type": "Object",
            "optional": false,
            "field": "device",
            "description": "<p>Device info object</p>"
          }
        ],
        "device": [
          {
            "group": "device",
            "type": "String",
            "optional": false,
            "field": "dev",
            "description": "<p>Dev system path /dev/sd*</p>"
          },
          {
            "group": "device",
            "type": "String",
            "optional": false,
            "field": "mount",
            "description": "<p>Device mount point</p>"
          },
          {
            "group": "device",
            "type": "Int",
            "optional": false,
            "field": "used",
            "description": "<p>Space used on device (byte)</p>"
          },
          {
            "group": "device",
            "type": "Int",
            "optional": false,
            "field": "available",
            "description": "<p>Space left on device</p>"
          },
          {
            "group": "device",
            "type": "Int",
            "optional": false,
            "field": "size",
            "description": "<p>Size (byte)</p>"
          },
          {
            "group": "device",
            "type": "String",
            "optional": false,
            "field": "model",
            "description": "<p>Model name</p>"
          },
          {
            "group": "device",
            "type": "String[]",
            "optional": false,
            "field": "ignoreList",
            "description": "<p>List of file what will be copied (from rsync dryrun)</p>"
          },
          {
            "group": "device",
            "type": "String[]",
            "optional": false,
            "field": "warnings",
            "description": "<p>List of non-critical errors while getting device info</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "HTTP-1/1 200:",
          "content": "[\n {\n     \"dev\":\"/dev/sdc1\",\n     \"mount\":\"/media/vfrc2/Transcend\",\n     \"used\":19655368704,\n     \"available\":12456087552,\n     \"size\":32111456256,\n     \"model\":\"Transcend 32GB\",\n     \"ignoreList\":[]\n }\n]",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "controllers/rsync.js",
    "groupTitle": "Rsync",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Rsync",
            "description": "<p>Error 500</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"error\": \"message\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/start",
    "title": "Start rsync",
    "name": "PostStart",
    "group": "Rsync",
    "description": "<p>Start rsync process</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "path",
            "description": "<p>Path to external hdd</p>"
          },
          {
            "group": "Parameter",
            "type": "string[]",
            "optional": false,
            "field": "extraArgs",
            "description": "<p>Extra args for rsync</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": " {\n    \"path\": \"full path where to copy file (ext hdd path)\",\n    \"extraArgs\": \"extra args for rsync\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "controllers/rsync.js",
    "groupTitle": "Rsync",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Rsync",
            "description": "<p>Error 500</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"error\": \"message\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/stop",
    "title": "Stop running rsync",
    "name": "PostStop",
    "group": "Rsync",
    "description": "<p>Request to stop running rsync</p>",
    "version": "0.0.0",
    "filename": "controllers/rsync.js",
    "groupTitle": "Rsync",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Rsync",
            "description": "<p>Error 500</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"error\": \"message\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "websocket",
    "url": "rsync.progress",
    "title": "Event copy progress",
    "group": "Websocket_Rsync",
    "description": "<p>Fire when rsync emit progress of copied file</p>",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "filename",
            "description": "<p>Name of curently coping file</p>"
          },
          {
            "group": "Success 200",
            "type": "int",
            "optional": false,
            "field": "size",
            "description": "<p>file size (bytes)</p>"
          },
          {
            "group": "Success 200",
            "type": "int",
            "optional": false,
            "field": "percent",
            "description": "<p>int 0..100</p>"
          },
          {
            "group": "Success 200",
            "type": "int",
            "optional": false,
            "field": "speed",
            "description": "<p>int (bits/s)</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "est",
            "description": "<p>est time</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "websocket data: {json}",
          "content": "{\n          filename: \"filename.ext\",\n          size: 1000\n          percent: 23,\n          speed: 1200,\n          est: \"3:45 min\"\n        }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "controllers/socket.js",
    "groupTitle": "Websocket_Rsync",
    "name": "WebsocketRsyncProgress"
  },
  {
    "type": "websocket",
    "url": "rsync.rawoutput",
    "title": "Event new output line",
    "group": "Websocket_Rsync",
    "description": "<p>Fire when rsync emit new output line</p>",
    "version": "0.0.0",
    "filename": "controllers/socket.js",
    "groupTitle": "Websocket_Rsync",
    "name": "WebsocketRsyncRawoutput"
  },
  {
    "type": "websocket",
    "url": "rsync.start",
    "title": "Event start",
    "group": "Websocket_Rsync",
    "description": "<p>Fire when rsync starts</p>",
    "version": "0.0.0",
    "filename": "controllers/socket.js",
    "groupTitle": "Websocket_Rsync",
    "name": "WebsocketRsyncStart"
  },
  {
    "type": "websocket",
    "url": "rsync.stop",
    "title": "Event stop",
    "group": "Websocket_Rsync",
    "description": "<p>Fire when rsync finished or killed</p>",
    "version": "0.0.0",
    "filename": "controllers/socket.js",
    "groupTitle": "Websocket_Rsync",
    "name": "WebsocketRsyncStop"
  }
] });
