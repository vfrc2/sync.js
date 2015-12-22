/**
 * Created by vfrc2 on 25.11.15.
 */
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.should();

describe('Running rsync with cat of real', function () {


    var expect = chai.expect;

    var Rsync = require("./../../models/rsync");
    var sr = require("./../../helpers/script-runner");
    var rp = require("./../../helpers/rsync-parser");


    it('shouldrun', function (done) {

        var rsync = new Rsync();

        rsync.setConfig({
            from: "tests/_share/from/",
            target: {path: "tests/_share/target"},
            defaultArgs: ['-ar']
        });

        var readedFiles = [];

        rsync.on('file', function (file) {
            readedFiles.push(file.filename)
        });

        var exitcode = rsync.start({path: "tests/_share/hdd", extraArgs: ["-n"]});

        exitcode.then(function() {
            expect(readedFiles.length > 0).to.equal(true);

            expect(readedFiles[0]).to.equal('list-last-files');
            expect(readedFiles[1]).to.equal('sixpair.c');
            done();
        }).catch(function(err){
            done(err);
        });

    });


});