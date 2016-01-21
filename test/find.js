"use strict";
var assert = require("assert");
var Client = require("../.");

var client = new Client("http://localhost:16006/rest");

describe("Testing jsonapi-client", function() {

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
      assert.equal(err.message, "\"articles do not have property foobar\"");

      done();
    });
  });
});
