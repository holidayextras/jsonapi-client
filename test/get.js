"use strict";
var assert = require("assert");
var Client = require("../.");

var client = new Client("http://localhost:16006/rest");

describe("Testing jsonapi-client", function() {

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
