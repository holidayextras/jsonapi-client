"use strict";
var assert = require("assert");
var Client = require("../.");

var client = new Client("http://localhost:16006/rest");

describe("Testing jsonapi-client", function() {

  it("deletes a resource", function(done) {
    client.get("people", "32fb0105-acaa-4adb-9ec4-8b49633695e1", { }, function(getErr, people) {
      assert.equal(getErr, null);

      people.delete(function(deleteErr) {
        assert.equal(deleteErr, null);

        assert.deepEqual(people._getBase(), {
          id: null,
          type: "people"
        });

        client.get("people", "32fb0105-acaa-4adb-9ec4-8b49633695e1", { }, function(err) {
          assert.equal(err.status, 404);
          assert.equal(err.message, "\"There is no people with id 32fb0105-acaa-4adb-9ec4-8b49633695e1\"");

          done();
        });
      });
    });
  });
});
