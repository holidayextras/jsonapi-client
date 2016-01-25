"use strict";
var assert = require("assert");
var Client = require("../.");
require("./_testServer.js");

var client = new Client("http://localhost:16006/rest");

describe("Testing jsonapi-client", function() {
  var uuid;

  context("mutates", function() {
    it("creates a resource", function(done) {
      var newPerson = client.create("people");
      newPerson.set("email", "mark.fermor@example.com");

      assert.deepEqual(newPerson.toJSON(), {
        id: null,
        type: "people",
        email: "mark.fermor@example.com"
      });

      newPerson.sync(function(err1) {
        assert.equal(err1, null);
        uuid = newPerson._getUid();
        assert.ok(newPerson._getUidString().match(/[a-z0-9-]+\/people/));

        client.get("people", newPerson._getUid(), { }, function(err2, somePerson) {
          assert.equal(err2, null);
          assert.equal(newPerson, somePerson);

          done();
        });
      });
    });

    it("syncs a resource", function(done) {
      client.get("people", uuid, { }, function(err1, people) {
        assert.equal(err1, null);
        assert.equal(people.get("email"), "mark.fermor@example.com");

        people.set("email", "fermor.mark@example.com");
        people.sync(function(err2) {
          assert.equal(err2, null);

          assert.equal(people.get("email"), "fermor.mark@example.com");

          client.get("people", uuid, { }, function(err3, people2) {
            assert.equal(err3, null);
            assert.equal(people2.get("email"), "fermor.mark@example.com");

            assert.equal(people, people2);

            done();
          });
        });
      });
    });


    it("deletes a resource", function(done) {
      client.get("people", uuid, { }, function(getErr, people) {
        assert.equal(getErr, null);

        people.delete(function(deleteErr) {
          assert.equal(deleteErr, null);

          assert.deepEqual(people._getBase(), {
            id: null,
            type: "people"
          });

          client.get("people", uuid, { }, function(err) {
            console.log(arguments);
            assert.equal(err.status, 404);
            assert.equal(err.message, "\"There is no people with id " + uuid + "\"");

            done();
          });
        });
      });
    });
  });

  it("passes back server errors", function(done) {
    var newArticle = client.create("articles");
    newArticle.set("content", "foobar");

    assert.deepEqual(newArticle.toJSON(), {
      id: null,
      type: "articles",
      content: "foobar"
    });

    newArticle.sync(function(err1) {
      assert.equal(err1.status, 403); // (Resource is missing "title" attribute)

      done();
    });
  });
});
