var express = require('express');
var app = express();

var server = app.listen(3000, function (err) {
    "use strict";

    if (err != null)
        console.log("Error starting server");

    console.log("Serever start at http://%s:%s", server.address().address, server.address().port);
});

var io = require("socket.io")(server);

app.use(express.static('public'));

app.use(require("./controllers")(io));

app.use(errorLog);

app.use(errorHandler);

function errorLog(err, req, res, next) {
    "use strict";
    console.log(err.stack);
    console.log("***************");
    next(err);
};

function errorHandler(err, req, res, next) {
    "use strict";
    res.status(500);
    res.end("Internal server error");
};

