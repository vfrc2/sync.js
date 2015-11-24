/**
 * Created by vfrc2 on 24.11.15.
 */

var expect = require('chai').expect; //actually call the function
var assert = require('chai').assert; //actually call the function

describe("Script runner", function () {

    var sr = require('./../../helpers/scriptRunner');
    var Promise = require("promise");
    var Stream = require("stream");

    describe('then call spawn', function () {

        var p = sr.spawn("ping", ["8.8.8.8", "-c 1"]);

        it('should return promise', function () {
            expect(p).to.be.an.instanceof(Promise);
        });

        it('resolved promise should', function (done) {

            p.then(function(result){

                expect(result.done).to.be.instanceof(Promise);
                done();

            }).done();
        });

    });

});