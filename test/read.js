"use strict";
var assert = require("assert");
var Client = require("../.");
require("./_testServer.js");

var client = new Client("http://localhost:16006/rest");

describe("Testing jsonapi-client", function() {

  context("searches for resources", function() {
    it("resource.toJSONTree() should provide developer-friendly debug info", function(done) {
      client.find("people", { include: "articles", filter: { lastname: "Rumbelow"}}, function(err, people) {
        assert.equal(err, null);

        var treeView = people.map(function(person) {
          return person.toJSONTree();
        });

        assert.deepEqual(treeView, [
          {
            "id": "cc5cca2e-0dd8-4b95-8cfc-a11230e73116",
            "type": "people",
            "firstname": "Oli",
            "lastname": "Rumbelow",
            "email": "oliver.rumbelow@example.com",
            "articles": [
              {
                "id": "de305d54-75b4-431b-adb2-eb6b9e546014",
                "type": "articles",
                "title": "NodeJS Best Practices",
                "status": "published",
                "content": "na",
                "author": "[Circular]",
                "created": "2016-01-05",
                "views": "10",
                "tags": [
                  {
                    "type": "tags",
                    "id": "7541a4de-4986-4597-81b9-cf31b6762486"
                  }
                ],
                "photos": [],
                "comments": [
                  {
                    "type": "comments",
                    "id": "3f1a89c2-eb85-4799-a048-6735db24b7eb"
                  }
                ]
              }
            ],
            "photos": null
          }
        ]);

        done();
      });
    });

    it("finds resources", function(done) {
      client.find("articles", { }, function(err, people) {
        assert.equal(err, null);
        assert.equal(people.length, 4);

        done();
      });
    });

    it("filters resources", function(done) {
      client.find("articles", { filter: { title: "<M" } }, function(err, people) {
        assert.equal(err, null);
        assert.equal(people.length, 2);

        done();
      });
    });

    it("passes back server errors", function(done) {
      client.find("articles", { filter: { foobar: "<M" } }, function(err) {
        assert.ok(err instanceof Error);
        assert.equal(err.message, "\"articles do not have attribute or relationship 'foobar'\"");

        done();
      });
    });
  });

  it("gets existing resources", function() {
    it("gets a resource", function(done) {
      client.get("people", "ad3aa89e-9c5b-4ac9-a652-6670f9f27587", { }, function(err, people) {
        assert.equal(err, null);
        assert.deepEqual(people.toJSON(), {
          id: "ad3aa89e-9c5b-4ac9-a652-6670f9f27587",
          type: "people",
          firstname: "Rahul",
          lastname: "Patel",
          email: "rahul.patel@example.com",
          articles: undefined,
          photos: undefined
        });

        done();
      });
    });

    it("links included resources", function(done) {
      client.get("people", "d850ea75-4427-4f81-8595-039990aeede5", { include: "photos" }, function(err, people) {
        assert.equal(err, null);
        assert.ok(people.photos);
        assert.equal(people, people.photos[0].photographer);
        assert.deepEqual(people.photos[0].toJSON(), {
          id: "72695cbd-e9ef-44f6-85e0-0dbc06a269e8",
          type: "photos",
          title: "Penguins",
          url: "http://www.example.com/penguins",
          height: 220,
          width: 60,
          photographer: {
            type: "people",
            id: "d850ea75-4427-4f81-8595-039990aeede5"
          },
          articles: undefined
        });
        done();
      });
    });
  });
  describe("fetches foreign resources", function() {
    var person, photo;

    before(function(done) {
      client.get("people", "d850ea75-4427-4f81-8595-039990aeede5", { }, function(err1, somePerson) {
        if (err1) throw err1;
        person = somePerson;

        done();
      });
    });

    it("fetches related foreign resources", function(done) {
      person.fetch("photos", function(err, photos) {
        assert.equal(err, null);
        assert.equal(photos.length, 1);
        assert.equal(person.photos[0], photos[0]);
        photo = photos[0];

        assert.deepEqual(person.photos[0].toJSON(), {
          "id": "72695cbd-e9ef-44f6-85e0-0dbc06a269e8",
          "type": "photos",
          "height": 220,
          "title": "Penguins",
          "url": "http://www.example.com/penguins",
          "width": 60,
          "raw": false,
          "photographer": {
            "id": "d850ea75-4427-4f81-8595-039990aeede5",
            "type": "people"
          },
          "tags": [
            "galapagos",
            "emperor"
          ],
          "articles": undefined
        });

        done();
      });
    });

    it("updating related resources throws an error", function() {
      assert.throws(function() { person.relationships("photos"); });
    });

    it("throws an error when adding a non-resource", function() {
      var somePhoto = person.photos[0];
      assert.throws(function() {
        somePhoto.relationships("photographer").add("foobar");
      }, /Expected Resource, got /);
    });

    it("removing the linked resource works fine", function(done) {
      var somePhoto = person.photos[0];
      assert.equal(somePhoto, photo);
      assert.equal(somePhoto.photographer, person);

      somePhoto.relationships("photographer").remove(person);
      somePhoto.sync(function(err) {
        assert.equal(err);

        assert.equal(person.photos.length, 0);
        assert.equal(somePhoto.photographer, null);
        done();
      });
    });

    it("restoring the linked resource works fine", function(done) {
      photo.relationships("photographer").set(person);
      photo.sync(function(err) {
        assert.equal(err);

        assert.equal(person.photos.length, 1);
        assert.equal(photo.photographer, person);
        done();
      });
    });

    it("finally, the remote object matches local object", function(done) {
      var personJson = person.toJSON();

      client.get("people", "d850ea75-4427-4f81-8595-039990aeede5", { }, function(err1, somePerson) {
        if (err1) throw err1;
        assert.equal(person, somePerson);
        assert.deepEqual(personJson, somePerson.toJSON());
        done();
      });
    });

    it("fetches foreign many to one relationships", function(done) {
      photo.fetch("photographer", function(err) {
        assert.equal(err, null);
        assert.deepEqual(photo.photographer.toJSON(), {
          id: "d850ea75-4427-4f81-8595-039990aeede5",
          type: "people",
          firstname: "Mark",
          lastname: "Fermor",
          email: "mark.fermor@example.com",
          articles: undefined,
          photos: [{
            id: "72695cbd-e9ef-44f6-85e0-0dbc06a269e8",
            type: "photos"
          }]
        });
        done();
      });
    });

  });

  describe("fetches primary resources", function() {
    var person;

    before(function(done) {
      client.get("people", "d850ea75-4427-4f81-8595-039990aeede5", { }, function(err1, somePerson) {
        if (err1) throw err1;
        person = somePerson;

        client.find("photos", { }, function(err2) {
          if (err2) throw err2;

          done();
        });
      });
    });

    it("fetches related foreign resources", function(done) {
      person.fetch("photos", function(err, photos) {
        assert.equal(err, null);
        assert.equal(photos.length, 1);
        assert.equal(person.photos[0], photos[0]);

        assert.deepEqual(person.photos[0].toJSON(), {
          "id": "72695cbd-e9ef-44f6-85e0-0dbc06a269e8",
          "type": "photos",
          "height": 220,
          "title": "Penguins",
          "url": "http://www.example.com/penguins",
          "width": 60,
          "raw": false,
          "photographer": {
            "id": "d850ea75-4427-4f81-8595-039990aeede5",
            "type": "people"
          },
          "tags": [
            "galapagos",
            "emperor"
          ],
          "articles": undefined
        });

        done();
      });
    });

    it("updating related resources throws and error", function() {
      assert.throws(function() { person.relationships("photos"); });
    });

  });

  describe.skip("testing invalid payloads", function() {
    it("doesn't crash when we get a non-conformant response", function(done) {
      var badClient = new Client("http://localhost:12345");
      badClient.find("articles", { }, function(err) {
        assert.deepEqual(err, {
          "status": "500",
          "code": "EUNKNOWN",
          "title": "An unknown error has occured",
          "detail": undefined
        });
        done();
      });
    });
  });

    describe("Initializes safely", function() {
      it("accepts options as an optional parameter", function() {

        var auth = {};
        var options = {
          cacheDuration: 500
        };
        var clientWithOptions = new Client("http://localhost:16006/rest", auth, options);
        assert.notEqual(clientWithOptions, null);

      });
    });


});
