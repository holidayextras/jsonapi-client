"use strict";
var assert = require("assert");
var Client = require("../.");

describe("Testing jsonapi-client", function() {
  describe("authentication", function() {

    it("is denied access with the blockme header", function(done) {
      var client = new Client("http://localhost:16006/rest", {
        header: {
          blockme: true
        }
      });

      client.get("people", "ad3aa89e-9c5b-4ac9-a652-6670f9f27587", function(err) {
        assert.equal(err.message, "401 Unauthorized");
        done();
      });
    });

    xit("is denied access with the blockMe cookie", function(done) {
      var client = new Client("http://localhost:16006/rest", {
        cookie: {
          blockMe: true
        }
      });

      client.get("people", "ad3aa89e-9c5b-4ac9-a652-6670f9f27587", function(err) {
        assert.equal(err.message, "401 Unauthorized");
        done();
      });
    });

  });
});
