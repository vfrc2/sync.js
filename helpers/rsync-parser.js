/**
 * Created by vfrc2 on 25.11.15.
 * Helper what split rsync and emit parsed object
 */

(function () {
    var Stream, buffers, splitter;

    buffers = require("buffers");

    Stream = require("stream");

    spliter.RSYNC_FORMAT="%i:%n:";

    module.exports = spliter;

    function spliter() {

        var buf, doSplit, emitToken, src, srcErrorHandler, stream;
        stream = new Stream();
        buf = buffers();

        var lastFilename = null;
        var delim = [
            ['\n', 1],
            ['\r', 1]
        ];

        stream.writable = true;
        stream.encoding = 'utf8';
        src = null;

        indexOfdel = function (buf, finalIndex) {

            var indexes = [];

            for (var i = 0; i < delim.length; i++) {
                if ((index = buf.indexOf(delim[i][0], Math.max(finalIndex, 0))) > -1)
                    indexes.push({index: index, len: delim[i][1]});
            }

            if (indexes.length == 0)
                return {index:-1, length:0};

            var min = indexes[0];

            for (var i = 1; i < indexes.length; i++) {
                if (min.index > indexes[i].index)
                    min = indexes[i];
            }

            return min;
        };

        var fileExpr = (/^(.)f.*:(.*):/im);
        var progressExpr = (/^(.*?)((\d{1,3})%)\s*(.*\/s)\s*(\d*:\d*:\d*)/im);

        emitToken = function (token) {
            if (stream.encoding) {
                token = token.toString(stream.encoding);
            }

            stream.emit("line", token);

            if ((m = fileExpr.exec(token)) && m.length > 1) {
                lastFilename = m[2].toString();
                return stream.emit("file",
                    {
                        operation: _decodeOperation(m[1]),
                        filename: lastFilename
                    })
            }

            if (lastFilename && (m = progressExpr.exec(token)) && m.length > 4)
                return stream.emit("progress",
                    {
                        filename: lastFilename,
                        size: m[1].trim(),
                        percent: parseInt(m[3]),
                        speed: m[4],
                        est: m[5]
                    })
        };

        doSplit = function () {
            var finalIndex, index;
            finalIndex = 0;

            while ((index = indexOfdel(buf, finalIndex)).index > -1) {
                emitToken(buf.slice(Math.max(finalIndex, 0), index.index));
                finalIndex = index.index + index.len;
                if (finalIndex >= buf.length) {
                    buf = buffers();
                    return;
                }
            }
            if (finalIndex > -1) {
                return buf.splice(0, finalIndex);
            }
        };

        stream.write = function (data, encoding) {
            stream.emit("data", data);
            try {
                if ("string" === typeof data) {
                    data = new Buffer(data, encoding);
                }
                buf.push(data);
                doSplit();
                return true;
            } catch (err) {
                stream.emit("error", err);
                return false;
            }
        };

        stream.end = function (data, encoding) {
            if (data) {
                stream.write(data, encoding);
            }
            stream.writable = false;
            if (buf.length) {
                emitToken(buf.toBuffer());
            }
            stream.emit("done");
            return src && src.removeListener("error", srcErrorHandler);
        };

        srcErrorHandler = function (err) {
            if (!(src.listeners("error").length > 1)) {
                return stream.emit("error", err);
            }
        };

        stream.on("pipe", function (_src) {
            src = _src;
            return src.on("error", srcErrorHandler);
        });
        return stream;
    };

    function _decodeOperation(value){

        if (value === '>')
            return "COPY";
        else
            return "OVER";

    }

}).call(this);