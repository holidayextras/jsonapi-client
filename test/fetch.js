"use strict";
var assert = require("assert");
var Client = require("../.");

var client = new Client("http://localhost:16006/rest");

describe("Testing jsonapi-client", function() {

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
          "photographer": {
            "id": "d850ea75-4427-4f81-8595-039990aeede5",
            "type": "people"
          },
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
      }, /Expected Resource, got String/);
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
          "photographer": {
            "id": "d850ea75-4427-4f81-8595-039990aeede5",
            "type": "people"
          },
          "articles": undefined
        });

        done();
      });
    });

    it("updating related resources throws and error", function() {
      assert.throws(function() { person.relationships("photos"); });
    });

  });

});
