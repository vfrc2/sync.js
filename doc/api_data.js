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
    "groupTitle": "Rsync"
  }
] });