"use strict";
var assert = require("assert");
var Client = require("../.");
require("./_testServer.js");

var client = new Client("http://localhost:16006/rest");

describe("Testing jsonapi-client", function() {

  context("supports promises", function() {

    it("client.find", function(done) {
      client.find("people", { }).then(function(people) {
        assert.ok(people[0] instanceof Client.Resource);
      }).then(done, done);
    });

    it("client.get", function(done) {
      client.get("people", "d850ea75-4427-4f81-8595-039990aeede5", { }).then(function(person) {
        assert.ok(person instanceof Client.Resource);
      }).then(done, done);
    });

    it("client.fetch", function(done) {
      client.get("people", "d850ea75-4427-4f81-8595-039990aeede5", { }).then(function(person) {
        return person.fetch("articles");
      }).then(function(articles) {
        assert.ok(articles[0] instanceof Client.Resource);
      }).then(done, done);
    });

    it("create-sync-delete", function(done) {
      var newPerson = client.create("people");
      var uuid;
      newPerson.sync().then(function() {
        uuid = newPerson._getUid();
        return newPerson.delete();
      }).then(function() {
        return client.get("people", uuid, { });
      }).then(function() {
        throw new Error("Should have errored!");
      }, function(err) {
        assert.ok(err.message.match(/There is no people with id /));
        done();
      });
    });

  });

});
