/**
 * Created by vfrc2 on 24.11.15.
 *
 * Index for web server
 *
 */
var express = require('express');
var router = express.Router();

router.use('/api', require('./rsync'));

//router.use('/', function(req,res,next){
//    res.redirect('index.html');
//});

module.exports = router;