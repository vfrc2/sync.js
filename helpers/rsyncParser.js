/**
 * Created by vfrc2 on 25.11.15.
 * Helper what split rsync and emit parsed object
 */

(function () {
    var Stream, buffers, splitter;

    buffers = require("buffers");

    Stream = require("stream");

    module.exports = splitter = function () {

        var buf, doSplit, emitToken, src, srcErrorHandler, stream;
        stream = new Stream();
        buf = buffers();

        var delim = [
            ['\n', 1],
            ['\r', 1]
        ];

        stream.writable = true;
        stream.encoding = 'utf8'
        src = null;

        indexOfdel = function (buf, finalIndex) {

            var indexes = [];

            for(var i=0; i<delim.length; i++){
                if ((index = buf.indexOf(delim[i][0], Math.max(finalIndex, 0))) > -1)
                    indexes.push({index: index, len: delim[i][1]});
            }

            var min = indexes[0];

            for(var i=1; i<indexes.length; i++){
                if (min.index > indexes[i].index)
                    min = indexes[i];
            }

            return min;
        };

        emitToken = function (token) {
            if (stream.encoding) {
                token = token.toString(stream.encoding);
            }
            return stream.emit("token", token);
        };

        doSplit = function () {
            var finalIndex, index;
            finalIndex = -1;
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
            if ("string" === typeof data) {
                data = new Buffer(data, encoding);
            }
            buf.push(data);
            doSplit();
            return true;
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

}).call(this);