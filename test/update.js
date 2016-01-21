"use strict";
var assert = require("assert");
var Client = require("../.");

var client = new Client("http://localhost:16006/rest");

describe("Testing jsonapi-client", function() {

  it("syncs a resource", function(done) {
    client.get("people", "d850ea75-4427-4f81-8595-039990aeede5", { }, function(err1, people) {
      assert.equal(err1, null);
      assert.equal(people.get("email"), "mark.fermor@example.com");

      people.set("email", "fermor.mark@example.com");
      people.sync(function(err2) {
        assert.equal(err2, null);

        assert.equal(people.get("email"), "fermor.mark@example.com");

        client.get("people", "d850ea75-4427-4f81-8595-039990aeede5", { }, function(err3, people2) {
          assert.equal(err3, null);
          assert.equal(people2.get("email"), "fermor.mark@example.com");

          assert.equal(people, people2);

          done();
        });
      });
    });
  });
});
