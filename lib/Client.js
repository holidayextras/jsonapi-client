/* @flow weak */
"use strict";
var Client = module.exports = function(path, auth, options) {
  if (!path) {
    throw new Error("API path is needed to construct an instanceof jsonapi-client");
  }
  auth = auth || { };
  options = options || {};
  
  this._construct(path, auth, options);
};

if (typeof window !== "undefined") {
  window.JsonapiClient = Client; // eslint-disable-line
}

var Promise = require("promise");
// Promise.denodeify = function(a) { return a; };
var Resource = require("./Resource");
Client.Resource = Resource;
var Transport = require("./Transport");
var createResourceCache = require("./resourceCache");

Client.prototype._construct = function(path, auth, options) {
  this._resourceCache = createResourceCache(options);
  this._transport = new Transport(path, auth);
};

Client.prototype.find = Promise.denodeify(function(type, options, callback) {
  var self = this;

  if (typeof options === "function") {
    callback = options;
    options = { };
  }

  this._transport.search(type, options, function(err, rawResponse, rawResources, rawIncludes) {
    if (err) return callback(err);

    var resources = rawResources.map(function(someRawResource) {
      return new Resource(someRawResource, self);
    });
    if (rawIncludes) {
      rawIncludes.forEach(function(someRawResource) {
        return new Resource(someRawResource, self);
      });
    }

    return callback(null, resources);
  });
});

Client.prototype.get = Promise.denodeify(function(type, id, options, callback) {
  var self = this;

  if (typeof options === "function") {
    callback = options;
    options = { };
  }

  this._transport.find(type, id, options, function(err, rawResponse, rawResource, rawIncludes) {
    if (err) return callback(err);

    var resource = new Resource(rawResource, self);
    if (rawIncludes) {
      rawIncludes.forEach(function(someRawResource) {
        return new Resource(someRawResource, self);
      });
    }

    return callback(null, resource);
  });
});

Client.prototype._getRelated = function(resource, relation, options, callback) {
  var self = this;
  this._transport.fetch(resource, relation, options, function(err, rawResponse, rawResources, rawIncludes) {
    if (err) return callback(err);

    if (rawIncludes) {
      rawIncludes.forEach(function(someRawResource) {
        return new Resource(someRawResource, self);
      });
    }

    if (!(rawResources instanceof Array)) {
      var rawResource = new Resource(rawResources, self);
      return callback(null, rawResource);
    }

    var resources = rawResources.map(function(someRawResource) {
      return new Resource(someRawResource, self);
    });

    return callback(null, resources);
  });
};

Client.prototype.create = function(type, properties) {
  var newResource = new Resource({
    id: null,
    type: type,
    attributes: properties || { },
    relationships: { }
  }, this);
  return newResource;
};

Client.prototype._remoteCreate = function(resource, callback) {
  this._transport.create(resource, callback);
};

Client.prototype._update = function(resource, callback) {
  this._transport.update(resource, callback);
};

Client.prototype._delete = function(resource, callback) {
  this._transport.delete(resource, callback);
};
