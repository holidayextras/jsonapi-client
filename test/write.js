"use strict";
var assert = require("assert");
var async = require("async");
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

  context("relations", function() {
    it("adds and then deletes a previously unrelated resources", function(done) {
      async.waterfall([
        async.apply(async.parallel, {
          article: function(callback) {
            client.get("articles", "1be0913c-3c25-4261-98f1-e41174025ed5", callback);
          },
          tag: function(callback) {
            client.get("tags", "8d196606-134c-4504-a93a-0d372f78d6c5", callback);
          }
        }),
        function(res, callback) {
          res.article.relationships("tags").add(res.tag);
          async.waterfall([
            function(cb) {
              res.article.sync(cb);
            },
            function(cb) {
              res.article.fetch("tags", cb);
            },
            function(tags, cb) {
              assert.equal(tags.length, 2, "article was expected to have 2 tags");
              return cb(null);
            }
          ], function(err) {
            if (err) return callback(err);
            return callback(null, res);
          });
        },
        function(res, callback) {
          res.article.relationships("tags").remove(res.tag);
          async.waterfall([
            function(cb) {
              res.article.sync(cb);
            },
            function(cb) {
              res.article.fetch("tags", cb);
            },
            function(tags, cb) {
              assert.equal(tags.length, 1, "article was expected to have 1 tag");
              return cb(null);
            }
          ], callback);
        }
      ], function(err) {
        assert.equal(err, null);
        done();
      });
    });
  });

  context("relations", function() {
    it("doesn't duplicate related resources added multiple times", function(done) {
      async.waterfall([
        async.apply(async.parallel, {
          article: function(callback) {
            client.get("articles", "1be0913c-3c25-4261-98f1-e41174025ed5", callback);
          },
          tag: function(callback) {
            client.get("tags", "2a3bdea4-a889-480d-b886-104498c86f69", callback);
          }
        }),
        function(res, callback) {
          res.article.relationships("tags").add(res.tag);
          res.article.sync(function(err) {
            if (err) callback(err);
            return callback(null, res.article);
          });
        },
        function(article, callback) {
          article.fetch("tags", callback);
        },
        function(tags, callback) {
          assert.equal(tags.length, 1, "article was expected to only have 1 tag");
          return callback(null);
        }
      ], function(err) {
        assert.equal(err, null);
        done();
      });
    });
  });

});
