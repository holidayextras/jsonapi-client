"use strict";
var assert = require("assert");
var Client = require("../.");

var client = new Client("http://localhost:16006/rest");

describe("Testing jsonapi-client", function() {

  it("creates a resource", function(done) {
    var newPerson = client.create("people");
    newPerson.set("email", "foo@bar.com");

    assert.deepEqual(newPerson.toJSON(), {
      id: null,
      type: "people",
      email: "foo@bar.com"
    });

    newPerson.sync(function(err1) {
      assert.equal(err1, null);
      assert.ok(newPerson._getUidString().match(/[a-z0-9-]+\/people/));

      client.get("people", newPerson._getUid(), { }, function(err2, somePerson) {
        assert.equal(err2, null);
        assert.equal(newPerson, somePerson);

        done();
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
