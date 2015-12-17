/**
 * Created by mlyasnikov on 31.10.2015.
 */

//Excpetions for rsync

function RsyncError(message) {
    "use strict";
    this.message = message;

    if ("captureStackTrace" in Error)
        Error.captureStackTrace(this, RsyncError);
    else
        this.stack = (new Error()).stack;
}

RsyncError.prototype = Object.create(Error.prototype);
RsyncError.prototype.name = "RsyncError";
RsyncError.prototype.constructor = RsyncError;

module.exports = RsyncError;