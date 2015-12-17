"use strict";
var assert = require("assert");
var jsonApiTestServer = require("jsonapi-server/example/server.js");
var Client = require("../.");

describe("Testing jsonapi-client", function() {
  describe("authentication", function() {

    it("is denied access with the blockme header", function(done) {
      var client = new Client("http://localhost:16006/rest", {
        header: {
          blockme: true
        }
      });

      client.get("people", { }, function(err) {
        assert.equal(err.message, "401 Unauthorized");
        done();
      });
    });

    it("is denied access with the blockMe cookie", function(done) {
      var client = new Client("http://localhost:16006/rest", {
        cookie: {
          blockMe: true
        }
      });

      client.get("people", { }, function(err) {
        assert.equal(err.message, "401 Unauthorized");
        done();
      });
    });

  });

  before(function() {
    jsonApiTestServer.start();
  });
  after(function() {
    jsonApiTestServer.close();
  });
});
