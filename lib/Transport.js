"use strict";
var Transport = module.exports = function(options) {
  options = options || { };
  this._construct(options);
};

var request = require("superagent");

Transport.prototype._construct = function(path) {
  this._path = path;
};

Transport.prototype._action = function(method, url, data, callback) {
  // console.log(method, url, JSON.stringify(data, null, 2));
  request[method](url).send(data).end(function(err, payload) {
    // console.log("=>", err, JSON.stringify(JSON.parse(payload.text), null, 2));
    if (err) {
      // console.log(err.response.text);
      var response;
      try {
        response = JSON.parse(err.response.text);
      } catch(e) {
        return callback(new Error("Invalid response from server"));
      }

      var realErrors = response.errors.map(function(apiError) {
        var someError = new Error(JSON.stringify(apiError.detail));
        someError.name = apiError.title;
        someError.status = apiError.status;
        someError.code = apiError.code;

        return someError;
      });

      return callback(realErrors[0]);
    }
    return callback(null, payload.body, payload.body.data, payload.body.included);
  });
};

Transport.prototype.search = function(type, options, callback) {
  var url = this._path + "/" + type;
  this._action("get", url, options, callback);
};

Transport.prototype.find = function(type, id, options, callback) {
  var url = this._path + "/" + type + "/" + id;
  this._action("get", url, options, callback);
};

Transport.prototype.fetch = function(resource, relation, callback) {
  var url = resource._getPathFor(relation);
  this._action("get", url, { }, callback);
};

Transport.prototype.create = function(resource, callback) {
  var url = this._path + "/" + resource._getBase().type;
  this._action("post", url, {
    data: resource._getRaw()
  }, callback);
};

Transport.prototype.update = function(resource, callback) {
  var url = this._path + "/" + resource._getBase().type + "/" + resource._getBase().id;
  this._action("patch", url, {
    data: resource._getDelta()
  }, callback);
};

Transport.prototype.delete = function(resource, callback) {
  var url = this._path + "/" + resource._getBase().type + "/" + resource._getBase().id;
  this._action("del", url, null, callback);
};
